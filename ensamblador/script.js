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

    // Ensamblado con botón para borrar solo de tu lista actual
    let suma = 0;
    ensamblado.forEach((p, i) => {
        listaEnsamblado.innerHTML += `
            <li>
                ${p.nombre} - $${p.precio}
                <button onclick="eliminarDelEnsamblado(${i})" style="color:orange; border:none; background:none; cursor:pointer;">[Quitar]</button>
            </li>`;
        suma += p.precio;
    });
    totalSpan.textContent = suma.toFixed(2);
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

// ARRANQUE
cargarDeSheets();