// CONEXIÓN ÚNICA AL SHEETS[cite: 25]
const API_URL = 'https://script.google.com/macros/s/AKfycbzKHLXqqbt-z2i1B-7sDF4njCIJyRjN5-fcDJPTYiAe2NE6tW6BOHHuYlccmUcssfGR/exec';

async function fetchOrders() {
    const loader = document.getElementById('loader');
    loader.className = 'loader-visible';
    
    try {
        const response = await fetch(API_URL);
        const orders = await response.json();
        renderOrders(orders);
    } catch (error) {
        console.error("Fallo en la matriz de datos:", error);
    } finally {
        loader.className = 'loader-hidden';
    }
}

function renderOrders(orders) {
    const list = document.getElementById('orders-list');
    const activeCount = document.getElementById('active-count');
    list.innerHTML = '';
    
    let count = 0;

    orders.reverse().forEach(order => {
        const isDelivered = String(order.estatus).toUpperCase() === 'ENTREGADO';
        if (!isDelivered) count++;

        const items = order.detalles.split('\n').filter(line => line.trim() !== "");
        const listHTML = items.map(item => `<li>${item}</li>`).join('');

        const card = document.createElement('div');
        card.className = `order-card ${isDelivered ? 'delivered' : 'active'}`;
        
        // BUSCA ESTA SECCIÓN DENTRO DE renderOrders Y REEMPLÁZALA:

        card.innerHTML = `
            <div class="card-header">
                <span class="order-id">ID: ${order.id_orden}</span>
                <span class="status-badge">${order.estatus}</span>
            </div>
            
            <div class="client-info" style="color: var(--snax-orange); font-weight: bold; margin: 10px 15px; font-size: 0.85rem;">
                > CLIENTE: ${order.cliente_wa || 'ANÓNIMO'}
            </div>

            <ul class="details-list">
                ${listHTML}
            </ul>

            <div class="card-footer-new" style="border-top: 1px solid #333; padding: 10px 15px; font-size: 0.75rem; font-family: 'JetBrains Mono', monospace;">
                <span style="color: var(--text-dim);">FECHA: ${new Date(order.fecha).toLocaleString('es-MX', { hour12: true })}</span>
                <span style="color: var(--text-dim); margin: 0 5px;">|</span>
                <span style="color: var(--green-tech); font-weight: bold;">TOTAL: $${parseFloat(order.total).toFixed(2)}</span>
            </div>

            ${!isDelivered ? `
                <button onclick="markDelivered('${order.id_orden}')" class="action-btn">
                    MARCAR_ENTREGADO
                </button>
            ` : ''}
        `;
        list.appendChild(card);
    });

    activeCount.textContent = count;
}
// Nota: Para que markDelivered funcione, necesitas añadir la lógica en Apps Script 
// para recibir una acción 'UPDATE' y buscar la fila correspondiente.
async function markDelivered(id) {
    if (!confirm(`¿Confirmar despacho de la orden ${id}?`)) return;

    const loader = document.getElementById('loader');
    loader.className = 'loader-visible';
    loader.textContent = "ACTUALIZANDO_ESTATUS...";

    const payload = {
        action: "UPDATE",
        id_orden: id
    };

    try {
        // Enviamos la petición de actualización[cite: 20]
        await fetch(API_URL, {
            method: 'POST',
            mode: 'no-cors', // Seguimos en no-cors por restricciones de Google
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(payload)
        });

        // Esperamos un segundo para que el Sheets procese y refrescamos
        setTimeout(() => {
            fetchOrders();
            alert(`Orden ${id} marcada como ENTREGADO.`);
        }, 1500);

    } catch (error) {
        console.error("Error al actualizar:", error);
        alert("Error de conexión con el núcleo de datos.");
    } finally {
        loader.className = 'loader-hidden';
    }
}

// Inicio automático y auto-refresco cada 2 minutos
fetchOrders();
setInterval(fetchOrders, 120000);