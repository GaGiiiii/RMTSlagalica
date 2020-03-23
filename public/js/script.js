// function formatDate(oldDate){
//   let options = { year: 'numeric', month: 'long', day: 'numeric' };
//   // let date = movie.created_at;
//   console.log(oldDate);

//   newDate = Date(oldDate).toLocaleDateString("en-US", options);

//   return newDate;
// }

// let DateDiff = {

//   inDays: function(d1, d2) {
//       let t2 = d2.getTime();
//       let t1 = d1.getTime();

//       return parseInt((t2-t1)/(24*3600*1000));
//   },

//   inWeeks: function(d1, d2) {
//       let t2 = d2.getTime();
//       let t1 = d1.getTime();

//       return parseInt((t2-t1)/(24*3600*1000*7));
//   },

//   inMonths: function(d1, d2) {
//       let d1Y = d1.getFullYear();
//       let d2Y = d2.getFullYear();
//       let d1M = d1.getMonth();
//       let d2M = d2.getMonth();

//       return (d2M+12*d2Y)-(d1M+12*d1Y);
//   },

//   inYears: function(d1, d2) {
//       return d2.getFullYear()-d1.getFullYear();
//   }
// }


// let dateDIVs = document.querySelectorAll('.dateDIVClass');

// dateDIVs.forEach((dateDIV) => {
  // let oldDate = dateDIV.innerHTML;
  // let newDate = formatDate(oldDate);
  // zika = peraa(pera);
  // console.log(newDate);
  // dateDIV.innerHTML = zika;
// });
// console.log(dateDIVs[0].innerText);
// let dString = dateDIV.innerHTML;
// let d1 = new Date(dString);
// let d2 = new Date();
// let daysDiff = DateDiff.inDays(d1, d2);
// let text = "";

// if(daysDiff < 1){
//   text = "<strong>Created: </strong> Today.";
// }else{
//   text = "<strong>Created: </strong>" + daysDiff + " day(s) ago.";
// }

// dateDIV.innerHTML = text;

const form = document.querySelector('#add-new-comment-form');

function validateNewCommentForm(event){

  let error = "";

  let commentTextarea = document.querySelector('#commentBodyID')
  let commentContent = document.querySelector('#commentBodyID').value
  let errorDiv = document.querySelector('#missing-comment-error');

  if(commentContent == ""){
    error += "Comment field is required."
  }

  if(error != ""){
    errorDiv.innerHTML = "<i class='fa fa-times-circle'></i> " + error;
    errorDiv.classList.add("text-danger");
    commentTextarea.classList.add("is-invalid");
    
    return false;
  }else{

    return true;
  }
}

function validateEditCommentForm(form){

  let commentID = form.getAttribute('name');
  // console.log(form.getAttribute('name'));
  
  let error = "";

  let commentTextarea = document.querySelector('#commentBodyEditID' + String(commentID));
  let commentContent = commentTextarea.value
  let errorDiv = document.querySelector('#missing-edit-comment-error' + String(commentID));

  if(commentContent == ""){
    error += "Comment field is required."
  }

  if(error != ""){
    errorDiv.innerHTML = "<i class='fa fa-times-circle'></i> " + error;
    errorDiv.classList.add("text-danger");
    commentTextarea.classList.add("is-invalid");
    
    return false;
  }else{
    return true;
  }

}

let pathname = window.location.pathname; // Returns path only (/path/example.html)
let url      = window.location.href;     // Returns full URL (https://example.com/path/example.html)
let origin   = window.location.origin;   // Returns base URL (https://example.com)

let res = pathname.split("/");
let commentID = res[4];
// alert(res[4]);
// alert(pathname)
if(commentID){
  $('html, body').animate({
    scrollTop: $("#" + commentID).offset().top
  }, 1000);

  $("#" + commentID).css({"border": "2px solid black"});
}


