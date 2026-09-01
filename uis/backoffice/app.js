const navLinks = document.querySelectorAll(".sidebar nav a");

function setActive(hash) {
  navLinks.forEach((link) => {
    const isMatch = hash ? link.getAttribute("href") === hash : link.getAttribute("href") === "/";
    link.classList.toggle("active", isMatch);
  });
}

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    const href = link.getAttribute("href");
    if (href.startsWith("#")) setActive(href);
  });
});

setActive(window.location.hash);
