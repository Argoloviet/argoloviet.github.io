// --- 1. CONFIGURACIÓN ---
const URL_SCRIPT = "https://script.google.com/macros/s/AKfycbxCfaHgHGkla_oLgro-ZocA1O-REcC8Tzzm5rw72clNWTjNa-YmbapMzxE1Y9JXyegiyg/exec";
const CLAVE_CORRECTA = "arsocorp2026";

// --- 2. SEGURIDAD (Solo salta en el ensamblador) ---
if (window.location.pathname.includes("ensamblador.html")) {
    verificarAcceso();
}

function verificarAcceso() {
    const yaLogueado = sessionStorage.getItem("accesoConcedido");
    if (yaLogueado !== "true") {
        const password = prompt("¡Habla, Jefe! Clave de ArsoCorp:");
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

// --- 4. CARGA Y LIMPIEZA DE DATOS ---
async function cargarDeSheets() {
    try {
        const resp = await fetch(URL_SCRIPT);
        const data = await resp.json();
        
        // FILTRO DE SEGURIDAD: Borra filas vacías o corruptas del Excel
        partes = data.filter(p => p.nombre && p.nombre.toString().trim() !== "" && p.precio !== null);
        
        // Ordenamos de la A a la Z
        partes.sort((a, b) => a.nombre.localeCompare(b.nombre));
        
        actualizarInterfaz();
    } catch (error) {
        console.error("Error al cargar:", error);
    }
}

// --- 5. ACTUALIZAR PANTALLA (LA MÁGICA) ---
function actualizarInterfaz() {
    const listaPartes = document.getElementById("listaPartes");
    const selector = document.getElementById("selector");
    const listaEnsamblado = document.getElementById("listaEnsamblado");
    
    const filtroInv = document.getElementById("buscarInventario")?.value.toLowerCase() || "";
    const filtroSel = document.getElementById("buscarSelector")?.value.toLowerCase() || "";

    // A. Si estamos en INDEX.HTML (Inventario)
    if (listaPartes) {
        let htmlContent = "";
        partes.forEach((p, i) => {
            if (p.nombre.toLowerCase().includes(filtroInv)) {
                htmlContent += `
                <li>
                    <span>${p.nombre} - <b>$${p.precio}</b></span>
                    <button class="btn-remove" onclick="eliminarParteDelCatalogo(${i})">X</button>
                </li>`;
            }
        });
        listaPartes.innerHTML = htmlContent;
    }

    // B. Si estamos en ENSAMBLADOR.HTML (Selector)
    if (selector) {
        let options = '<option value="">-- Selecciona una pieza --</option>';
        partes.forEach((p, i) => {
            if (p.nombre.toLowerCase().includes(filtroSel)) {
                options += `<option value="${i}">${p.nombre} - $${p.precio}</option>`;
            }
        });
        selector.innerHTML = options;
    }

    // C. El carrito de ensamblado
    if (listaEnsamblado) {
        let htmlEns = "";
        let suma = 0;
        ensamblado.forEach((p, i) => {
            htmlEns += `
                <li>
                    <span>${p.nombre} - <b>$${p.precio}</b></span>
                    <button class="btn-remove" onclick="eliminarDelEnsamblado(${i})">X</button>
                </li>`;
            suma += p.precio;
        });
        listaEnsamblado.innerHTML = htmlEns;
        
        const t = document.getElementById("total");
        const t14 = document.getElementById("totalAumentado");
        if (t) t.textContent = suma.toFixed(2);
        if (t14) t14.textContent = (suma * 1.14).toFixed(2);
    }
}

// --- 6. ACCIONES DE BOTONES ---

// Mostrar/Ocultar Inventario
function toggleInventario() {
    const div = document.getElementById("contenedorInventario");
    const btn = document.getElementById("btnToggle");
    if (!div) return;

    if (div.style.display === "none" || div.style.display === "") {
        div.style.display = "block";
        btn.textContent = "OCULTAR INVENTARIO";
    } else {
        div.style.display = "none";
        btn.textContent = "MOSTRAR TODO EL INVENTARIO";
    }
}

// Agregar al Inventario (index.html)
async function agregarParte() {
    const n = document.getElementById("nombre");
    const p = document.getElementById("precio");
    
    if (n && p && n.value && p.value) {
        // Limpiamos el precio por si usan comas en vez de puntos
        let precioLimpio = p.value.replace(",", ".");
        const nueva = { nombre: n.value.trim(), precio: parseFloat(precioLimpio) };
        
        partes.push(nueva);
        partes.sort((a, b) => a.nombre.localeCompare(b.nombre));
        actualizarInterfaz();

        await fetch(URL_SCRIPT, {
            method: "POST",
            mode: "no-cors",
            body: JSON.stringify(nueva)
        });

        n.value = ""; p.value = "";
    } else {
        alert("Llena los campos, batería.");
    }
}

// Borrar del Almacén
async function eliminarParteDelCatalogo(indice) {
    if (confirm("¿Borrar del almacén permanentemente?")) {
        partes.splice(indice, 1);
        actualizarInterfaz();
        // Mandamos la lista completa para sincronizar el borrado en la nube
        await fetch(URL_SCRIPT, {
            method: "POST",
            mode: "no-cors",
            body: JSON.stringify(partes)
        });
    }
}

// Lógica del Carrito (ensamblador.html)
function agregarAlEnsamblado() {
    const sel = document.getElementById("selector");
    if (sel && sel.value !== "") {
        ensamblado.push(partes[sel.value]);
        localStorage.setItem("ensamblado", JSON.stringify(ensamblado));
        actualizarInterfaz();
    }
}

function eliminarDelEnsamblado(i) {
    ensamblado.splice(i, 1);
    localStorage.setItem("ensamblado", JSON.stringify(ensamblado));
    actualizarInterfaz();
}

function limpiarEnsamblado() {
    if (confirm("¿Vaciar todo el presupuesto?")) {
        ensamblado = [];
        localStorage.setItem("ensamblado", JSON.stringify(ensamblado));
        actualizarInterfaz();
    }
}

// WhatsApp
function compartirWhatsApp() {
    if (ensamblado.length === 0) return alert("Agrega piezas primero.");
    let msj = "*Presupuesto ArsoCorp*%0A%0A";
    ensamblado.forEach(p => msj += `- ${p.nombre}: $${p.precio}%0A`);
    const totalFinal = (ensamblado.reduce((s, x) => s + x.precio, 0) * 1.14).toFixed(2);
    msj += `%0A*TOTAL FINAL (+14%): $${totalFinal}*`;
    window.open(`https://wa.me/?text=${msj}`, '_blank');
}

// ARRANQUE INICIAL
cargarDeSheets();

