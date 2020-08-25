let counter = 0;
let counter2;

while(true){
    let trs = document.querySelectorAll('#game-' + counter + " tr");

    if(trs.length == 0){
        break;
    }

    let points = document.querySelector('#game-' + counter++ + "-points").innerHTML.trim();
    let array = points.split(',');
    counter2 = 0;

    trs.forEach(tr => {
        for(let i = 0; i < 6; i++){
            td = document.createElement('td');
            td.innerHTML = array[counter2++];
            td.classList.add('center');
            tr.appendChild(td);
        }
    });
}