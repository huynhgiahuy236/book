import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const queries = [["award winning fiction","Văn học"],["personal development","Kỹ năng"],["psychology","Tâm lý"],["economics business","Kinh tế"],["world history","Lịch sử"],["popular science","Khoa học"]];
const target=30,seen=new Set(),books=[];
const clean=(text="")=>text.replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();
const slug=(text)=>text.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/đ/g,"d").replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");
const demoPrice=(id)=>69000+([...id].reduce((n,c)=>n+c.charCodeAt(0),0)%9)*10000;

for(const [query,category] of queries){
  const url=new URL("https://openlibrary.org/search.json");
  url.searchParams.set("q",query);
  url.searchParams.set("lang","vi");
  url.searchParams.set("limit","25");
  url.searchParams.set("fields","key,title,subtitle,author_name,publisher,first_publish_year,isbn,cover_i,language,subject,number_of_pages_median,ratings_average,ratings_count");
  const response=await fetch(url,{headers:{"User-Agent":"CapstoneBook-Educational-Demo/1.0 (local academic project)"}});
  if(!response.ok)throw new Error(`Open Library ${response.status}: ${query}`);
  const payload=await response.json();
  for(const info of payload.docs??[]){
    const isbn13=info.isbn?.find((x)=>x.length===13);
    const externalId=info.key?.replace("/works/","");
    const identity=isbn13??externalId;
    if(!info.title||!info.author_name?.length||!info.cover_i||!identity||seen.has(identity))continue;
    seen.add(identity);
    books.push({
      id:`${slug(info.title).slice(0,46)}-${externalId.slice(0,8)}`,
      externalId,source:"OPEN_LIBRARY",sourceUrl:`https://openlibrary.org${info.key}`,
      title:clean(info.title),subtitle:clean(info.subtitle),authors:info.author_name.map(clean),
      publisher:clean(info.publisher?.[0]),publishedDate:info.first_publish_year?String(info.first_publish_year):null,
      description:"",isbn10:info.isbn?.find((x)=>x.length===10)??null,isbn13:isbn13??null,
      pageCount:info.number_of_pages_median??null,language:info.language?.includes("vie")?"vi":(info.language?.[0]??"vi"),
      categories:[category,...(info.subject??[]).slice(0,5)].filter(Boolean),
      coverUrl:`https://covers.openlibrary.org/b/id/${info.cover_i}-L.jpg`,previewUrl:`https://openlibrary.org${info.key}`,
      averageRating:info.ratings_average??null,ratingsCount:info.ratings_count??0,
      format:books.length%3===0?"EBOOK":"PHYSICAL",premium:books.length%4===0,price:demoPrice(identity),
      pricingNote:"DEMO_PRICE_NOT_RETAIL",importedAt:new Date().toISOString(),
    });
    if(books.length>=target)break;
  }
  if(books.length>=target)break;
  await new Promise((done)=>setTimeout(done,1100));
}
if(books.length<12)throw new Error(`Chỉ lấy được ${books.length} sách hợp lệ`);
const json=JSON.stringify(books,null,2)+"\n";
await Promise.all([
  writeFile(resolve("backend/data/books.real.json"), json, "utf8"),
  writeFile(resolve("frontend/src/features/catalog/data/books.real.json"), json, "utf8"),
]);
console.log(`Imported ${books.length} real book records from Open Library.`);
