var trash = document.querySelectorAll(".fas.fa-minus-circle");
console.log("trash");
Array.from(trash).forEach(function(element) {
  element.addEventListener("click", function() {
    console.log(this.parentNode.parentNode.childNodes);
    const notes = this.parentNode.parentNode.childNodes[1].innerText;
    // const date = this.parentNode.parentNode.childNodes[3].innerText;
    // const situation = this.parentNode.parentNode.childNodes[5].innerText;
    // const outcome = this.parentNode.parentNode.childNodes[7].innerText;
    // const notes = this.parentNode.parentNode.childNodes[9].innerText;
    fetch("generic", {
      //generic
      method: "put",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        notes: notes
        // date: date,
        // situation: situation,
        // outcome: outcome,
        // notes: notes
      })
    }).then(function(response) {
      window.location.reload();
    });
  });
});
