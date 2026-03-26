// Fade-up observer
const obs = new IntersectionObserver(
    (entries) => {
        entries.forEach((e, i) => {
            if (e.isIntersecting) {
                setTimeout(
                    () => e.target.classList.add("visible"),
                    e.target.dataset.d || 0,
                );
                obs.unobserve(e.target);
            }
        });
    },
    { threshold: 0.1 },
);
document.querySelectorAll(".fade-up").forEach((el, i) => {
    el.dataset.d = (i % 5) * 80;
    obs.observe(el);
});

// Filter catalog
document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
        document
            .querySelectorAll(".filter-btn")
            .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const f = btn.dataset.filter;
        document.querySelectorAll(".product-card").forEach((card) => {
            const match = f === "all" || card.dataset.cat === f;
            card.style.display = match ? "" : "none";
        });
    });
});

// Active nav on scroll
const secs = document.querySelectorAll("section[id]");
const navAs = document.querySelectorAll(".nav-links a");
window.addEventListener("scroll", () => {
    let cur = "";
    secs.forEach((s) => {
        if (window.scrollY >= s.offsetTop - 100) cur = s.id;
    });
    navAs.forEach((a) => {
        a.style.color = a.getAttribute("href") === "#" + cur ? "var(--gold)" : "";
    });
});

// Form handlers
function handleImport(btn) {
    const orig = btn.textContent;
    btn.textContent = "Enviando...";
    btn.disabled = true;
    setTimeout(() => {
        btn.textContent = "✓ Solicitud enviada";
        setTimeout(() => {
            btn.textContent = orig;
            btn.disabled = false;
        }, 3000);
    }, 1400);
}
function handleContact(btn) {
    const orig = btn.textContent;
    btn.textContent = "Enviando...";
    btn.disabled = true;
    setTimeout(() => {
        btn.textContent = "✓ Mensaje enviado";
        setTimeout(() => {
            btn.textContent = orig;
            btn.disabled = false;
        }, 3000);
    }, 1400);
}
function consultarProducto(btn) {
    const card = btn.closest(".product-card");

    const nombre = card.querySelector(".product-name").textContent;
    const precio = card.querySelector(".retail").textContent;
    const mayorista = card.querySelector(".wholesale").textContent;

    const mensaje = `Hola! Quiero consultár por este producto:%0A
📦 Producto: ${nombre}%0A
💰 Precio: ${precio}%0A
🏷️ ${mayorista}%0A
¿Hay stock?`;

    window.open("https://wa.me/5493885395300?text=" + mensaje, "_blank");
}
