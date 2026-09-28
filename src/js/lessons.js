export const LESSONS = [
 {t:'F + J — die Fühlpunkte',d:'Zeigefinger auf F/J mit Noppen. Nur diese zwei!',keys:'fj',words:['fj','jf','ff','jj','fjf','jfj']},
 {t:'D + K — Mittelfinger',d:'Mittelfinger dazu. Finger zurückfedern!',keys:'fjdk',words:['das','kajak','djak','fadd','kkdd']},
 {t:'S + L — Ringfinger',d:'Ringfinger = wackelig, normal. Ruhig bleiben.',keys:'fjdksl',words:['lass','salsa','falls','skald','sall']},
 {t:'A + Ö — kleine Finger',d:'Kleine Finger für A/Ö. Handkante stabil.',keys:'fjdkslaö',words:['salat','aloja','fass','lösch','aals']},
 {t:'G + H — Zeigefinger spreizen',d:'Zeigefinger nach innen zu G/H.',keys:'fjdkslaögh',words:['hasch','glas','flaggs','gash','hagel']},
 {t:'Ä — Grundreihe komplett',d:'Mini-Boss: ganze Grundreihe ASDFGH JKLÖÄ',keys:'asdfghjklöä',words:['das','glas','hals','lag','schal','has'],boss:false},
 {t:'R + U — obere Reihe 1',d:'Von F→R und J→U hochspringen, zurück!',keys:'fjr u',words:['duru','ruru','fur','ruf','juror']},
 {t:'E + I — das häufige E!',d:'E ist der häufigste deutsche Buchstabe.',keys:'fruei',words:['freie','eier','reife','feier','leier']},
 {t:'W + O — oben erweitern',d:'W/O dazu. Handgelenke ruhig.',keys:'frueiwo',words:['wore','rohe','wie','uwe','erio']},
 {t:'Q P T Z Ü — oben komplett 👑 BOSS',d:'Boss-Fight: ganze obere Reihe!',keys:'qwertzuiopü',words:['quiz','putz','quote','töpfe','würze'],boss:true},
 {t:'Unten: B N V M C , X . Y',d:'Daumen-nah zuerst (B/N), dann außen.',keys:'bnvmcx.,y',words:['my','baby','cyan','combin','nym']},
 {t:'FINAL BOSS: Alles + Sätze 🏆',d:'Echte Sätze mit Shift + Satzzeichen.',keys:'all',words:['Das ist mein Tempo!','Fixe Beute, quasi jung.','Übe fünf Minuten täglich!','Victor jagt zwölf Boxkämpfer.'],boss:true},
];

export const FINGER = {'a':'lk','q':'lk','y':'lk','s':'lr','w':'lr','x':'lr','d':'lm','e':'lm','c':'lm','f':'li','r':'li','v':'li','t':'li','g':'li','b':'li','h':'ri','z':'ri','n':'ri','u':'ri','j':'ri','m':'ri','k':'rm','i':'rm',',':'rm','l':'rr','o':'rr','.':'rr','ö':'rk','p':'rk','-':'rk','ä':'rk','ü':'rk','ß':'rk',' ':'t'};
export const FCOL = {li:'var(--f-li)',lm:'var(--f-li)',lr:'var(--f-lr)',lk:'var(--f-lk)',ri:'var(--f-ri)',rm:'var(--f-rm)',rr:'var(--f-rr)',rk:'var(--f-rk)',t:'var(--green)'};
export const FNAME = {li:'Zeige L',lm:'Mittel L',lr:'Ring L',lk:'Klein L',ri:'Zeige R',rm:'Mittel R',rr:'Ring R',rk:'Klein R',t:'Daumen'};
export const ROWS = [['1','2','3','4','5','6','7','8','9','0','ß'],['q','w','e','r','t','z','u','i','o','p','ü'],['a','s','d','f','g','h','j','k','l','ö','ä'],['y','x','c','v','b','n','m',',','.','-']];
export const WORDS = 'der und die das mit sich auf für ist ein eine nicht auch als an werden aus er hat dass sie nach wird bei einer um am sind noch wie einem über einen so zum war haben nur oder aber vor zur bis mehr durch man sein wurde sei schon sehr dich mich ihr euch unser euer zeit leben finger taste übung tempo wasser haus baum straße licht traum kraft mut'.split(' ');
