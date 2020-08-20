// Gives data for Skocko
function dataForSkocko(){
    const options = ['chrome', 'firefox', 'opera', 'safari', 'edge', 'ie'];
    let data = [];
  
    for(let i = 0; i < 4; i++){
      data.push(options[Math.floor(Math.random() * (options.length - 1 + 0.5))]);
    }
  
    return data;
  }

  exports.dataForSkocko = dataForSkocko;