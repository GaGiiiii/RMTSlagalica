// Gives data for KoZnaZna
function dataForKoZnaZna(){
    let dataTotal = { // All questions
      "DNS radi na portu: ": '53',
      "Sa kojim transportnim protokolom je u vezi DHCP ?": 'UDP',
      "Kod uspostavljanja TCP veze, koji su flegovi oznaceni na 1 u prvom segmentu koji se šalje ?": 'SYN',
      "Kako se drugačije naziva krajnji sistem ?": 'Host',
      "Bežični LAN pristup zasnovan je na IEEE (xxx.xx) ?": '802.11',
      "Na kom sloju radi HTTP ?": 'Aplikativnom',
      "TCP i UDP pripadaju kom sloju: ": 'Transportnom',
      "IP Adresa pripada kom sloju: ": 'Mrežnom',
      "Virus sakriven unutar nekog korisnog programa naziva se: ": 'Trojanski konj',
      "ICMP protokol koristi: ": 'IP pakete',
      "Kada UDP segment stigne do hosta, da bi poslao segment na odgovarajući socket OS koristi: ": 'Broj dolaznog porta',
      "HTTP Status kod kada je sve u redu je broj: ": '200',
      "Šta se koristi kako bi se utvrdilo da li su bitovi unutar UDP segmenta promenjeni ?": 'Kontrolni Zbir',
      "Koliki je IPv6 adresni prostor (broj na broj) ?": '2 na 128',
      "Koliki je IPv4 adresni prostor (broj na broj) ?": '2 na 32',
      "Koliko je veliki MAC adresni prostor (broj na broj) ?": '2 na 48',
      "Komanda u FTP Protokolu koja se koristi za preuzimanje datoteke iz tekućeg direktorijuma na udaljenom računaru je: ": 'RETR',
      "Sposobnost ubacivanja paketa na internet sa lažnom izvorišnom adresom uz pomoć čega korisnik može da se maskira kao neko drugi naziva se: ": 'IP spoofing',
      "Veb server radi na portu: ": '80',
      "Da li se propusni opseg ADSL konekcije deli (da / ne) ?": 'Ne',
      "Uslugu kontrole toka i kontrole zagusenja nudi protokol: ": 'TCP',
      "Niz komunikacionih linkova i komutatora paketa kojima prolaze paketi od polaznog do odredišnog krajnjeg sistema naziva se: ": 'Ruta',
      "DNS se na transportnom sloju oslanja na TCP protokol (T / N) ?": 'N',
      "Standardi za Ethernet i WiFi su IEEE (broj)": '802',
      "Protokol koji računaru iza NAT rutera omogućava da održava dvosmernu komunikaciju sa računarima u mreži od kojih ga deli NAT ruter naziva se: ": 'UnPn',
    }
  
    let helpArrayKeys = Object.keys(dataTotal); // Array holding all the keys from dataTotal object
    let helpArrayValues = Object.values(dataTotal); // Array holding all the values from dataTotal object
    let usedQuestions = []; // Array holding already used questions
    let questionNumber = 0; // Question number
    let data = {
      // Here we will store our final 10 chosen questions, for now its empty object
    };
  
    for(let i = 0; i < 10; i++){
      questionNumber = Math.floor(Math.random() * (helpArrayKeys.length - 1)); // Random number from 0 to number of questions in database
  
      while(usedQuestions.includes(questionNumber)){ // If question is already used choose another random number
        questionNumber = Math.floor(Math.random() * (helpArrayKeys.length - 1));
      }
  
      usedQuestions.push(questionNumber); // When we use question add it to used questions array
      data[helpArrayKeys[questionNumber]] = helpArrayValues[questionNumber]; // Add choosen question to final data array
      // data.helpArrayKeys[questionNumber] = helpArrayValues[questionNumber]; Mozda se pitate zasto ovo dole ne moze ? Zato sto Javascript.
    }
  
    return data;
  }

  exports.dataForKoZnaZna = dataForKoZnaZna;