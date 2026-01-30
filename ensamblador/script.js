// --- 1. CONFIGURACIÓN ---
const URL_SCRIPT = "https://script.google.com/macros/s/AKfycbwo8Tz5oXEwJK2e0Z4ObYLOMLxKXc8n13lqy2N1OL0WHAgKBpr4Ky9i-v5NPYJT7wk05Q/exec";
const CLAVE_CORRECTA = "arsocorp2026";

// --- 2. SEGURIDAD (Solo para ensamblador.html) ---
if (window.location.pathname.includes("ensamblador.html")) {
    verificarAcceso();
}

function verificarAcceso() {
    const yaLogueado = sessionStorage.getItem("accesoConcedido");
    if (yaLogueado !== "true") {
        const password = prompt("¡Habla! Clave de ArsoCorp:");
        if (password === CLAVE_CORRECTA) {
            sessionStorage.setItem("accesoConcedido", "true");
        } else {
            alert("Acceso denegado, causa.");
            window.location.href = "index.html";
        }
    }
}

// --- 3. VARIABLES GLOBALES ---
let partes = [];
let ensamblado = JSON.parse(localStorage.getItem("ensamblado")) || [];

// --- 4. FUNCIONES DE NUBE ---
async function cargarDeSheets() {
    try {
        const resp = await fetch(URL_SCRIPT);
        partes = await resp.json();
        actualizarInterfaz();
    } catch (error) {
        console.error("Error con Sheets:", error);
    }
}

async function guardarEnSheets() {
    await fetch(URL_SCRIPT, {
        method: "POST",
        mode: "no-cors", 
        body: JSON.stringify(partes)
    });
}

// --- 5. LÓGICA DE INVENTARIO (index.html) ---
async function agregarParte() {
    const n = document.getElementById("nombre");
    const p = document.getElementById("precio");
    if (n && p && n.value && p.value) {
        partes.push({ nombre: n.value, precio: Number(p.value) });
        actualizarInterfaz();
        await guardarEnSheets();
        n.value = ""; p.value = "";
    } else {
        alert("Mete datos reales, pe'");
    }
}

async function eliminarParteDelCatalogo(indice) {
    if (confirm("¿Borrar del almacén?")) {
        partes.splice(indice, 1);
        actualizarInterfaz();
        await guardarEnSheets();
    }
}

function toggleInventario() {
    const div = document.getElementById("contenedorInventario");
    const btn = document.getElementById("btnToggle");
    if (div.style.display === "none") {
        div.style.display = "block";
        btn.textContent = "OCULTAR INVENTARIO";
    } else {
        div.style.display = "none";
        btn.textContent = "MOSTRAR TODO EL INVENTARIO";
    }
}

// --- 6. LÓGICA DE ENSAMBLADO (ensamblador.html) ---
function agregarAlEnsamblado() {
    const sel = document.getElementById("selector");
    if (sel && sel.value !== "") {
        // Buscamos el objeto original para no liarnos con el índice del filtro
        const item = partes.find(p => p.nombre === sel.options[sel.selectedIndex].text.split(" - ")[0]);
        if(item) {
            ensamblado.push(item);
            localStorage.setItem("ensamblado", JSON.stringify(ensamblado));
            actualizarInterfaz();
        }
    }
}

function eliminarDelEnsamblado(indice) {
    ensamblado.splice(indice, 1);
    localStorage.setItem("ensamblado", JSON.stringify(ensamblado));
    actualizarInterfaz();
}

function limpiarEnsamblado() {
    if (confirm("¿Vaciar lista?")) {
        ensamblado = [];
        localStorage.setItem("ensamblado", JSON.stringify(ensamblado));
        actualizarInterfaz();
    }
}

function compartirWhatsApp() {
    if (ensamblado.length === 0) return alert("Agrega algo primero.");
    let msj = "¡Presupuesto ArsoCorp!%0A";
    ensamblado.forEach(p => msj += `- ${p.nombre}: $${p.precio}%0A`);
    const total = (ensamblado.reduce((s, x) => s + x.precio, 0) * 1.14).toFixed(2);
    msj += `%0A*TOTAL (+14%): $${total}*`;
    window.open(`https://wa.me/?text=${msj}`, '_blank');
}

// --- 7. LA ÚNICA FUNCIÓN PARA ACTUALIZAR TODO ---
function actualizarInterfaz() {
    const listaPartes = document.getElementById("listaPartes");
    const selector = document.getElementById("selector");
    const listaEnsamblado = document.getElementById("listaEnsamblado");
    
    const filtroInv = document.getElementById("buscarInventario")?.value.toLowerCase() || "";
    const filtroSel = document.getElementById("buscarSelector")?.value.toLowerCase() || "";

    // Ordenar siempre A-Z
    partes.sort((a, b) => a.nombre.localeCompare(b.nombre));

    // Inventario
    if (listaPartes) {
        listaPartes.innerHTML = "";
        partes.forEach((p, i) => {
            if (p.nombre.toLowerCase().includes(filtroInv)) {
                listaPartes.innerHTML += `<li>${p.nombre} - $${p.precio} <button class="btn-remove" onclick="eliminarParteDelCatalogo(${i})">X</button></li>`;
            }
        });
    }

    // Selector
    if (selector) {
        selector.innerHTML = '<option value="">-- Resultados --</option>';
        partes.forEach((p, i) => {
            if (p.nombre.toLowerCase().includes(filtroSel)) {
                selector.innerHTML += `<option value="${i}">${p.nombre} - $${p.precio}</option>`;
            }
        });
    }

    // Lista Ensamblado
    if (listaEnsamblado) {
        listaEnsamblado.innerHTML = "";
        let suma = 0;
        ensamblado.forEach((p, i) => {
            listaEnsamblado.innerHTML += `<li>${p.nombre} - $${p.precio} <button class="btn-remove" onclick="eliminarDelEnsamblado(${i})">X</button></li>`;
            suma += p.precio;
        });
        
        const t = document.getElementById("total");
        const t14 = document.getElementById("totalAumentado");
        if (t) t.textContent = suma.toFixed(2);
        if (t14) t14.textContent = (suma * 1.14).toFixed(2);
    }
}

// --- ARRANQUE ---
cargarDeSheets();
