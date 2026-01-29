// --- SISTEMA DE SEGURIDAD ARSOCORP ---
const CLAVE_CORRECTA = "arsocorp2026"; // <--- Cambia tu clave aquí, cholo

function verificarAcceso() {
    // Revisamos si ya puso la clave antes en esta sesión
    const yaLogueado = sessionStorage.getItem("accesoConcedido");

    if (yaLogueado !== "true") {
        const password = prompt("¡Habla! Ingresa la clave de ArsoCorp para entrar:");

        if (password === CLAVE_CORRECTA) {
            // Guardamos que ya entró para que no pida de nuevo
            sessionStorage.setItem("accesoConcedido", "true");
            alert("¡Clave correcta! Bienvenido, jefe.");
        } else {
            alert("¡Tú no eres de la batería! Acceso denegado.");
            // Lo mandamos a la página principal para que no joda
            window.location.href = "../index.html"; 
            
            // Por si las moscas, bloqueamos el body
            document.body.innerHTML = "<h1 style='color:white; text-align:center; margin-top:50px;'>No tienes permiso, causa.</h1>";
        }
    }
}

// Ejecutamos la seguridad al toque
verificarAcceso();
// --- FIN SEGURIDAD ---
// Capturando los elementos (Bien ahí, batería)
const nombreInput = document.getElementById("nombre");
const precioInput = document.getElementById("precio");
const listaPartes = document.getElementById("listaPartes");
const selector = document.getElementById("selector");
const listaEnsamblado = document.getElementById("listaEnsamblado");
const totalSpan = document.getElementById("total");

// "partes" vendrá de Google Sheets, "ensamblado" se queda en tu compu (localStorage)
let partes = [];
let ensamblado = JSON.parse(localStorage.getItem("ensamblado")) || [];

// LA URL DE TU SCRIPT (Cuidado con los espacios)
const URL_SCRIPT = "https://script.google.com/macros/s/AKfycbwo8Tz5oXEwJK2e0Z4ObYLOMLxKXc8n13lqy2N1OL0WHAgKBpr4Ky9i-v5NPYJT7wk05Q/exec";

// 1. Jalar la data del Excel apenas carga la página
async function cargarDeSheets() {
    try {
        const resp = await fetch(URL_SCRIPT);
        const data = await resp.json();
        partes = data;
        actualizarInterfaz(); // Usamos el nombre correcto de la función
    } catch (error) {
        console.error("Hubo un choque con el Sheets:", error);
    }
}

// 2. Guardar el catálogo en el Excel
async function guardarEnSheets() {
    await fetch(URL_SCRIPT, {
        method: "POST",
        mode: "no-cors", // Esto es clave para que Google no te rebote por seguridad
        body: JSON.stringify(partes)
    });
}

// 3. Agregar parte al catálogo (Nube)
async function agregarParte() {
    const nombre = nombreInput.value;
    const precio = Number(precioInput.value);

    if (nombre && precio) {
        partes.push({ nombre, precio });
        actualizarInterfaz();
        nombreInput.value = "";
        precioInput.value = "";
        await guardarEnSheets(); 
        
    } else {
        alert("¡Habla bien! Mete datos reales.");
    }
}

// 4. Actualizar toda la pantalla
function actualizarInterfaz() {
    listaPartes.innerHTML = "";
    selector.innerHTML = "";
    listaEnsamblado.innerHTML = "";

    // Catálogo con botón para borrar de la nube
    partes.forEach((p, i) => {
        listaPartes.innerHTML += `
            <li>
                ${p.nombre} - $${p.precio} 
                <button onclick="eliminarParteDelCatalogo(${i})" style="color:red; border:none; background:none; cursor:pointer;">[X]</button>
            </li>`;
        selector.innerHTML += `<option value="${i}">${p.nombre}</option>`;
    });
    let suma = 0;
    ensamblado.forEach((p, i) => {
        listaEnsamblado.innerHTML += `
            <li>
                <span>${p.nombre} - <b>$${p.precio}</b></span>
                <button class="btn-remove" onclick="eliminarDelEnsamblado(${i})">QUITAR</button>
            </li>`;
        suma += p.precio;
    });

    // Cálculos
    const aumentado = suma * 1.14; // El 14% más

    // Mostrar en pantalla
    document.getElementById("total").textContent = suma.toFixed(2);
    document.getElementById("totalAumentado").textContent = aumentado.toFixed(2);
}
// Borrar del catálogo (afecta a Google Sheets)
async function eliminarParteDelCatalogo(indice) {
    if (confirm("¿Seguro que quieres borrar este producto del catálogo? Se borrará para todos.")) {
        partes.splice(indice, 1); // Lo quitamos del array
        actualizarInterfaz();      // Refrescamos la pantalla
        await guardarEnSheets();   // Mandamos el cambio a la nube
    }
}

// Borrar solo del ensamblado (afecta tu localStorage)
function eliminarDelEnsamblado(indice) {
    ensamblado.splice(indice, 1); // Lo quitamos de tu lista
    localStorage.setItem("ensamblado", JSON.stringify(ensamblado)); // Guardamos en tu compu
    actualizarInterfaz(); // Refrescamos
}
// 5. Agregar al carrito de ensamblado (Local)
function agregarAlEnsamblado() {
    const indice = selector.value;
    if (indice !== "") {
        const p = partes[indice];
        ensamblado.push(p);
        localStorage.setItem("ensamblado", JSON.stringify(ensamblado)); // Guardar ensamble
        actualizarInterfaz();
    }
}

// 6. Limpiar solo el ensamblado
function limpiarEnsamblado() {
    ensamblado = [];
    localStorage.setItem("ensamblado", JSON.stringify(ensamblado));
    actualizarInterfaz();
    alert("¡Ensamble limpiecito!");
}

// 7. Resetear todo (Nube y Local)
async function resetearTodo() {
    if(confirm("¿Vas a borrar TODO (incluyendo la nube)? No seas loco.")) {
        partes = [];
        ensamblado = [];
        localStorage.clear();
        await guardarEnSheets(); // Limpia el Excel también
        location.reload();
    }
}
function compartirWhatsApp() {
    if (ensamblado.length === 0) {
        alert("¡Primero agrega algo al ensamble, pe'!");
        return;
    }

    let mensaje = "¡Habla! Aquí tienes el presupuesto de ArsoCorp:%0A%0A";
    
    ensamblado.forEach((p) => {
        mensaje += `- ${p.nombre}: $${p.precio}%0A`;
    });

    const totalFinal = (ensamblado.reduce((s, x) => s + x.precio, 0) * 1.14).toFixed(2);
    
    mensaje += `%0A*TOTAL FINAL (+14%): $${totalFinal}*`;

    // Abrir WhatsApp con el mensaje listo
    window.open(`https://wa.me/?text=${mensaje}`, '_blank');
}
// ARRANQUE
cargarDeSheets();

