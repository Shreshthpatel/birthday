// Called when fireworks finish
function startSecondAnimation() {
  document.getElementById("c").style.display = "none";
  let cakeSection = document.getElementById("second-animation");
  cakeSection.style.display = "block";

  // Show button for third animation after cake is shown
  setTimeout(() => {
    let nextBtn = document.createElement("button");
    nextBtn.innerText = "Next Surprise 🎁";
    nextBtn.style.cssText = `
      position: fixed;
      bottom: 50px;
      left: 50%;
      transform: translateX(-50%);
      padding: 15px 30px;
      font-size: 20px;
      background: #ff4081;
      border: none;
      border-radius: 10px;
      color: white;
      cursor: pointer;
      z-index: 1000;
      opacity: 0;
      transition: opacity 1s;
    `;
    document.body.appendChild(nextBtn);

    setTimeout(() => { nextBtn.style.opacity = "1"; }, 100);

    nextBtn.addEventListener("click", () => {
      cakeSection.style.display = "none";
      nextBtn.remove();
      startThirdAnimation(); // Your final animation function
    });
  }, 8000); // 8s after cake shows
}
