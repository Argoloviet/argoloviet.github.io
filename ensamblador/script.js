// --- 1. CONFIGURACIÓN ---
const URL_SCRIPT = "https://script.google.com/macros/s/AKfycbyeGiWsHhA7XbRMzSpcYW1ETrEwwHbhO__XwmozWcunSxgwD1MsAZTVu74XeeynMHWbxQ/exec";
const CLAVE_CORRECTA = "arsocorp2026";

// --- 2. SEGURIDAD ---
if (window.location.pathname.includes("index.html")) {
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

// --- 4. CARGA DE DATOS ---
async function cargarDeSheets() {
    try {
        const resp = await fetch(URL_SCRIPT);
        const data = await resp.json();
        partes = data.filter(p => p.nombre && p.nombre.toString().trim() !== "");
        partes.sort((a, b) => a.nombre.localeCompare(b.nombre));
        actualizarInterfaz();
    } catch (error) {
        console.error("Error al cargar:", error);
    }
}

// --- 5. ACTUALIZAR INTERFAZ ---
function actualizarInterfaz() {
    const listaPartes = document.getElementById("listaPartes");
    const selector = document.getElementById("selector");
    const listaEnsamblado = document.getElementById("listaEnsamblado");
    
    const filtroInv = document.getElementById("buscarInventario")?.value.toLowerCase() || "";
    const filtroSel = document.getElementById("buscarSelector")?.value.toLowerCase() || "";

    partes.sort((a, b) => a.nombre.localeCompare(b.nombre));

    if (listaPartes) {
        let html = "";
        partes.forEach((p) => {
            if (p.nombre.toLowerCase().includes(filtroInv)) {
                // DOBLE CANDADO: Mandamos nombre y precio al botón X
                html += `
                <li>
                    <span>${p.nombre} - <b>$${p.precio}</b></span>
                    <button class="btn-remove" onclick="eliminarParteDelCatalogo('${p.nombre.replace(/'/g, "\\'")}', '${p.precio}')">X</button>
                </li>`;
            }
        });
        listaPartes.innerHTML = html;
    }

    if (selector) {
        let options = '<option value="">-- Resultados --</option>';
        partes.forEach((p, i) => {
            if (p.nombre.toLowerCase().includes(filtroSel)) {
                options += `<option value="${i}">${p.nombre} - $${p.precio}</option>`;
            }
        });
        selector.innerHTML = options;
    }

    if (listaEnsamblado) {
        let htmlEns = "";
        let suma = 0;
        ensamblado.forEach((p, i) => {
            htmlEns += `<li><span>${p.nombre} - <b>$${p.precio}</b></span> 
                        <button class="btn-remove" onclick="eliminarDelEnsamblado(${i})">X</button></li>`;
            suma += p.precio;
        });
        listaEnsamblado.innerHTML = htmlEns;
        
        const t = document.getElementById("total");
        const t14 = document.getElementById("totalAumentado");
        if (t) t.textContent = suma.toFixed(2);
        if (t14) t14.textContent = (suma * 1.14).toFixed(2);
    }
}

// --- 6. ACCIONES ---
// --- AGREGAR CON ADVERTENCIA ---
async function agregarParte() {
    const n = document.getElementById("nombre");
    const p = document.getElementById("precio");
    
    if (n && p && n.value && p.value) {
        let nombreNuevo = n.value.trim();
        let precioNuevo = p.value.replace(",", ".");

        // REVISAR SI YA EXISTE IGUAL
        const existe = partes.find(item => 
            item.nombre.toLowerCase() === nombreNuevo.toLowerCase() && 
            item.precio.toString() === precioNuevo.toString()
        );

        if (existe) {
            if (!confirm(`¡Habla pashpito! "${nombreNuevo}" con precio $${precioNuevo} ya está en el inventario. ¿Seguro que quieres almacenarlo de nuevo?`)) {
                return; // Si dice que no, cancelamos
            }
        }

        const nueva = { nombre: nombreNuevo, precio: parseFloat(precioNuevo) };
        partes.push(nueva);
        actualizarInterfaz();

        await fetch(URL_SCRIPT, {
            method: "POST",
            mode: "no-cors",
            body: JSON.stringify({ nombre: nueva.nombre, precio: precioNuevo })
        });

        n.value = ""; p.value = "";
    }
}

// --- BORRAR SOLO UNO (FRANCOTIRADOR) ---
async function eliminarParteDelCatalogo(nombreABorrar, precioABorrar) {
    if (confirm(`¿Seguro que quieres borrar una unidad de "${nombreABorrar}"?`)) {
        
        const respaldo = [...partes];

        // Borramos solo el primero que encontremos en la lista local
        const indice = partes.findIndex(p => 
            p.nombre === nombreABorrar && p.precio.toString() === precioABorrar.toString()
        );
        
        if (indice !== -1) {
            partes.splice(indice, 1); // Quita solo 1 elemento
            actualizarInterfaz();

            try {
                await fetch(URL_SCRIPT, {
                    method: "POST",
                    mode: "no-cors",
                    body: JSON.stringify({
                        borrar: true,
                        nombre: nombreABorrar,
                        precio: precioABorrar.toString()
                    })
                });
            } catch (error) {
                partes = respaldo;
                actualizarInterfaz();
                alert("Error de conexión.");
            }
        }
    }
}

// Mostrar/Ocultar Inventario
function toggleInventario() {
    const div = document.getElementById("contenedorInventario");
    const btn = document.getElementById("btnToggle");
    if (div.style.display === "none" || div.style.display === "") {
        div.style.display = "block";
        btn.textContent = "OCULTAR INVENTARIO";
    } else {
        div.style.display = "none";
        btn.textContent = "MOSTRAR TODO EL INVENTARIO";
    }
}

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
    if (confirm("¿Vaciar presupuesto?")) {
        ensamblado = [];
        localStorage.setItem("ensamblado", JSON.stringify(ensamblado));
        actualizarInterfaz();
    }
}

function compartirWhatsApp() {
    if (ensamblado.length === 0) return alert("Agrega piezas.");
    let msj = "*Presupuesto ArsoCorp*%0A%0A";
    ensamblado.forEach(p => msj += `- ${p.nombre}: $${p.precio}%0A`);
    const totalFinal = (ensamblado.reduce((s, x) => s + x.precio, 0) * 1.14).toFixed(2);
    msj += `%0A*TOTAL FINAL (+14%): $${totalFinal}*`;
    window.open(`https://wa.me/?text=${msj}`, '_blank');
}

cargarDeSheets();

