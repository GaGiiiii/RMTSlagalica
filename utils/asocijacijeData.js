function dataForAsocijacije(){
    let data = {
      "KONACNO": ['KOMPJUTER', 'RAČUNAR', 'PC'],
      "A": ['HARDVER', 'MONITOR', 'TASTATURA', 'MIŠ', 'ŠTAMPAČ'],
      "B": ['SOFTVER', 'PROGRAM', 'APLIKACIJA', 'OPERATIVNI SISTEM', 'LICENCA'],
      "C": ['LAPTOP', 'PREKLAPANJE', 'MOBILAN', 'UREĐAJ', 'TOUCHPAD'],
      "D": ['IGRICA', 'WORLD OF WARCRAFT', 'CS:GO', 'LEAGUE OF LEGENDS', 'SUPER MARIO'],
    }
  
    let data2 = {
      "KONACNO": ["PROGRAMSKI JEZIK", "JEZIK", "PROGRAMIRANJE"],
      "A": ['PYTHON', 'ZMIJA', 'MAŠINSKO UČENJE', 'BEZ TAČKE ZAREZA', 'DJANGO'],
      "B": ['RUBY', 'DRAGI KAMEN', 'SAFIR', 'CRVEN', 'RAILS'],
      "C": ['JAVA', 'SAN', 'OBJEKTNO-ORIJENTISAN', 'KLASE', 'SCRIPT'],
      "D": ['C', 'VITAMIN', 'A', 'B', 'UGLJENIK'],
    }
  
    let array = [];
    array.push(data, data2);
  
    let randomIndex = Math.floor(Math.random() * (array.length - 1 + 0.5));
  
    return array[randomIndex]; // Gives random element from array
  }

  exports.dataForAsocijacije = dataForAsocijacije;