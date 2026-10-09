// Требуется Node.js и Playwright: npm install playwright; npx playwright install chromium.
// Запуск: node check-form.cjs. Новый прогон записывается отдельно от исходных доказательств.
const fs=require('fs'),path=require('path');
const {chromium}=require('playwright');
(async()=>{
 const out=path.resolve(process.argv[2]||'lab5-rerun');fs.mkdirSync(out,{recursive:true});
 const rows=JSON.parse(fs.readFileSync(path.join(__dirname,'design.json'),'utf8'));
 const browser=await chromium.launch();const context=await browser.newContext({viewport:{width:1366,height:900},locale:'en-US',timezoneId:'Europe/Moscow',deviceScaleFactor:1});const page=await context.newPage();
 const url=require('url').pathToFileURL(path.join(__dirname,'index.html')).href;const results=[];
 try{
  for(const r of rows){
   await page.goto(url);
   for(const [k,v] of Object.entries(r.data)){
    if(k==='role')await page.locator(`[name="${k}"]`).selectOption(v);
    else if(k==='format'){if(v)await page.locator(`[name="format"][value="${v}"]`).check();}
    else await page.locator(`[name="${k}"]`).fill(v);
   }
   await page.getByRole('button',{name:'Зарегистрироваться',exact:true}).click();
   const observed=await page.evaluate(()=>({result:document.querySelector('#result').textContent,errors:Object.fromEntries([...document.querySelectorAll('.error')].filter(x=>x.textContent).map(x=>[x.id.replace('-error',''),x.textContent])),input:Object.fromEntries(new FormData(document.querySelector('form')))}));
   const accepted=observed.result.startsWith('Регистрация принята:');const pass=r.valid?accepted&&Object.keys(observed.errors).length===0:!accepted&&Boolean(observed.errors[r.key])&&Object.keys(observed.errors).length===1;
   results.push({id:r.id,time:new Date().toISOString(),expected:r.expected,observed,status:pass?'Passed':'Failed'});
  }
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({date:new Date().toISOString(),browser:browser.version(),results},null,2));
  const failed=results.filter(x=>x.status==='Failed');console.log(`${results.length-failed.length}/${results.length} Passed`);if(failed.length)process.exitCode=1;
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
