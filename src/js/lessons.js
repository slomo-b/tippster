export const LESSONS = [
 {t:'F + J — the home bumps',d:'Index fingers rest on F/J (the little bumps). These two only!',keys:'fj',words:['fj','jf','ff','jj','fjf','jfj']},
 {t:'D + K — middle fingers',d:'Add the middle fingers. Let them spring back home.',keys:'fjdk',words:['das','kajak','djak','fadd','kkdd']},
 {t:'S + L — ring fingers',d:'Ring fingers feel shaky — that is normal. Stay calm.',keys:'fjdksl',words:['lass','salsa','falls','skald','sall']},
 {t:'A + Ö — pinkies',d:'Pinkies handle A/Ö. Keep the hand edge steady.',keys:'fjdkslaö',words:['salat','aloja','fass','lösch','aals']},
 {t:'G + H — index fingers reach in',d:'Reach inward with the index fingers for G/H.',keys:'fjdkslaögh',words:['hasch','glas','flaggs','gash','hagel']},
 {t:'Ä — home row complete',d:'Mini boss: the whole home row ASDFGH JKLÖÄ',keys:'asdfghjklöä',words:['das','glas','hals','lag','schal','has'],boss:false},
 {t:'R + U — top row, part 1',d:'Jump up from F→R and J→U, then straight back home.',keys:'fjr u',words:['duru','ruru','fur','ruf','juror']},
 {t:'E + I — the frequent E!',d:'E is the most common letter in German.',keys:'fruei',words:['freie','eier','reife','feier','leier']},
 {t:'W + O — extend the top row',d:'Add W/O. Keep the wrists relaxed.',keys:'frueiwo',words:['wore','rohe','wie','uwe','erio']},
 {t:'Q P T Z Ü — top row complete 👑 BOSS',d:'Boss fight: the entire top row!',keys:'qwertzuiopü',words:['quiz','putz','quote','töpfe','würze'],boss:true},
 {t:'Bottom: B N V M C , X . Y',d:'Thumb-side first (B/N), then work outward.',keys:'bnvmcx.,y',words:['my','baby','cyan','combin','nym']},
 {t:'FINAL BOSS: everything + sentences 🏆',d:'Real sentences with Shift and punctuation.',keys:'all',words:['Das ist mein Tempo!','Fixe Beute, quasi jung.','Übe fünf Minuten täglich!','Victor jagt zwölf Boxkämpfer.'],boss:true},
];

export const FINGER = {'1':'lk','2':'lr','3':'lm','4':'li','5':'li','6':'ri','7':'ri','8':'rm','9':'rr','0':'rk','a':'lk','q':'lk','y':'lk','s':'lr','w':'lr','x':'lr','d':'lm','e':'lm','c':'lm','f':'li','r':'li','v':'li','t':'li','g':'li','b':'li','h':'ri','z':'ri','n':'ri','u':'ri','j':'ri','m':'ri','k':'rm','i':'rm',',':'rm','l':'rr','o':'rr','.':'rr','ö':'rk','p':'rk','-':'rk','ä':'rk','ü':'rk','ß':'rk',' ':'t'};
export const FCOL = {li:'var(--f-li)',lm:'var(--f-li)',lr:'var(--f-lr)',lk:'var(--f-lk)',ri:'var(--f-ri)',rm:'var(--f-rm)',rr:'var(--f-rr)',rk:'var(--f-rk)',t:'var(--green)'};
export const FNAME = {li:'Index L',lm:'Middle L',lr:'Ring L',lk:'Pinky L',ri:'Index R',rm:'Middle R',rr:'Ring R',rk:'Pinky R',t:'Thumb'};
export const ROWS = [['1','2','3','4','5','6','7','8','9','0','ß'],['q','w','e','r','t','z','u','i','o','p','ü'],['a','s','d','f','g','h','j','k','l','ö','ä'],['y','x','c','v','b','n','m',',','.','-']];
export const WORDS = 'der und die das mit sich auf für ist ein eine nicht auch als an werden aus er hat dass sie nach wird bei einer um am sind noch wie einem über einen so zum war haben nur oder aber vor zur bis mehr durch man sein wurde sei schon sehr dich mich ihr euch unser euer zeit leben finger taste übung tempo wasser haus baum straße licht traum kraft mut'.split(' ');
