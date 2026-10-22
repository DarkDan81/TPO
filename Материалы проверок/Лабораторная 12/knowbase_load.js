import http from 'k6/http';
import {check,sleep} from 'k6';
const VUS=Number(__ENV.VUS||0);
const BASE_URL=__ENV.BASE_URL||'';
const LAB_TOKEN=__ENV.LAB_TOKEN||'';
if (![10,20,50].includes(VUS)) throw new Error('Разрешены 10, 20 и 50 VU');
if (BASE_URL!=='http://127.0.0.1:8080') throw new Error('Разрешён только локальный KnowBase');
if (!LAB_TOKEN || __ENV.CONFIRM_LAB_RUN!=='YES') throw new Error('Нет токена или подтверждения');
export const options={vus:VUS,duration:'30s',gracefulStop:'5s',thresholds:{
 http_req_failed:[{threshold:'rate<0.10',abortOnFail:true,delayAbortEval:'10s'}],
 http_req_duration:[{threshold:'p(95)<10000',abortOnFail:true,delayAbortEval:'10s'}],
 'http_reqs{endpoint:search}':['count>0'], 'http_reqs{endpoint:chat}':['count>0'],
 'http_req_duration{endpoint:search}':['p(95)<10000'], 'http_req_duration{endpoint:chat}':['p(95)<10000'],
 'http_req_failed{endpoint:search}':['rate<0.10'], 'http_req_failed{endpoint:chat}':['rate<0.10']}};
const headers={'Content-Type':'application/json',Authorization:`Bearer ${LAB_TOKEN}`,'X-Lab-Mode':'mock'};
export default function(){
 const search=http.get(`${BASE_URL}/api/v1/pages/search?categoryId=1&search=${encodeURIComponent('нагрузочное тестирование')}&fuzzySearch=false`,{headers,tags:{endpoint:'search'}});
 check(search,{'search: status 200':r=>r.status===200});sleep(1);
 const chat=http.post(`${BASE_URL}/api/v1/chat`,JSON.stringify({query:'Что такое нагрузочное тестирование?'}),{headers,tags:{endpoint:'chat'}});
 check(chat,{'chat: status 200':r=>r.status===200});sleep(1);
}
