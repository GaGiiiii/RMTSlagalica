// Gives data for Spojnice
function dataForSpojnice(){
    let data = {
      "PORUKA": "POVEŽITE ODGOVARAJUĆE PORTOVE",
      "WEB SERVER": '80',
      "E-POŠTA": '23',
      "DNS": '53',
      "FTP KONTROLNA VEZA": '21',
      "FTP VEZA PODATAKA": '20',
      "POP3": '110',
    }
  
    let data2 = {
      "PORUKA": "POVEŽITE STATUSNE KODOVE SA ODGOVARAJUĆIM ODGOVOROM",
      "OK": '200',
      "MOVED PERMANENTLY": '301',
      "NOT MODIFIED": '304',
      "BAD REQUEST": '400',
      "NOT FOUND": '404',
      "HTTP VERSION NOT SUPPORTED": '505',
    }
  
    let data3 = {
      "PORUKA": "POVEŽITE NAREDBE U PROGRAMSKOM JEZIKU JAVA SA ODGOVARAJUĆIM ZAHTEVOM",
      "PRIHVATA ZAHTEV I USPOSTAVLJA NOVU TCP KONEKCIJU": 'Socket socket = server.accept();',
      "INICIJALIZUJE TCP SERVERSKI SOKET": 'ServerSocket socket = new ServerSocket(6789);',
      "INSTANCIRA TCP KLIJENTSKI SOKET": 'Socket socket = new Socket(\"localhost\", 6789);',
      "PRIPREMA UDP SOKET ZA PRIJEM PODATAKA": 'DatagramSocket serverSocket = new DatagramSocket(9876);',
      "VRAĆA BROJ PORTA NA KOME SE NALAZI SOKET": ' Socket socket = new Socket(); socket.getPort();',
      "ŠALJE PAKET PREKO UDP PROTOKOLA": 'DatagramSocket socket = new datagramSocket(); DatagramPacket packet; socket.send(packet);',
    }
  
    let array = [];
    array.push(data, data2, data3);
  
    let randomIndex = Math.floor(Math.random() * (array.length - 1 + 0.5));
  
    return array[randomIndex]; // Gives random element from array
  }

  exports.dataForSpojnice = dataForSpojnice;