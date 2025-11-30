const DATA_FILE_PATH = 'data.json'
const APP_STATE = {
    appointments: []
}
const ELEMENTS = {
    app: document.getElementById('app'),
    appointmentList: null
}

const fetchData = async () => {
    try {
        const response = await fetch(DATA_FILE_PATH)
        if (!response.ok) throw new Error('Network response was not ok')
        const data = await response.json()
        return data.appointments || []
    } catch (error) {
        console.error('Error fetching data:', error)
        return []
    }
}

const saveData = async (data) => {
    try {
        const payload = { appointments: data }
        const response = await fetch(DATA_FILE_PATH, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        return response.ok
    } catch (error) {
        console.error('Error saving data:', error)
        return false
    }
}

const parseAppointment = (date, time) => {
    return new Date(`${date}T${time}:00`)
}

const handleAddAppointment = async (event) => {
    event.preventDefault()

    const patient = document.getElementById('patient-name').value.trim()
    const doctor = document.getElementById('doctor-name').value.trim()
    const date = document.getElementById('appointment-date').value
    const time = document.getElementById('appointment-time').value

    if (!patient || !doctor || !date || !time) {
        alert('Por favor, complete todos los campos')
        return
    }

    const appointmentTime = parseAppointment(date, time)

    if (appointmentTime < new Date()) {
        alert('No se puede agendar una cita en el pasado')
        return
    }

    const newAppointment = {
        id: Date.now(),
        patient,
        doctor,
        date: date,
        time: time,
        timestamp: appointmentTime.getTime()
    }

    APP_STATE.appointments.push(newAppointment)
    APP_STATE.appointments.sort((a, b) => a.timestamp - b.timestamp)

    const saveSuccess = await saveData(APP_STATE.appointments)
    if (saveSuccess) {
        document.getElementById('add-appointment-form').reset()
        renderAppointments()
        alert(`Cita agendada para ${patient} con Dr. ${doctor}`)
    } else {
        alert('Error al guardar la cita')
        APP_STATE.appointments.pop()
    }
}

const handleDeleteAppointment = async (id) => {
    const initialLength = APP_STATE.appointments.length
    APP_STATE.appointments = APP_STATE.appointments.filter(app => app.id !== id)

    const saveSuccess = await saveData(APP_STATE.appointments)
    if (saveSuccess) {
        renderAppointments()
    } else {
        alert('Error al eliminar la cita')
    }
}

const renderAppointments = () => {
    ELEMENTS.appointmentList.innerHTML = ''

    if (APP_STATE.appointments.length === 0) {
        ELEMENTS.appointmentList.innerHTML = '<p style="text-align: center; color: var(--secondary); padding: 2rem;">No hay citas agendadas.</p>'
        return
    }

    APP_STATE.appointments.forEach(app => {
        const item = document.createElement('div')
        item.className = 'appointment-item'
        item.innerHTML = `
            <div class="appointment-info">
                <h4>Paciente: ${app.patient}</h4>
                <p>Doctor: ${app.doctor}</p>
                <p>Fecha: ${app.date}</p>
                <p>Hora: ${app.time}</p>
            </div>
            <button type="button" class="delete-btn" data-id="${app.id}">Cancelar</button>
        `
        ELEMENTS.appointmentList.appendChild(item)
    })

    ELEMENTS.appointmentList.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', () => handleDeleteAppointment(parseInt(button.dataset.id, 10)))
    })
}

const createFormUI = () => {
    const formCard = document.createElement('div')
    formCard.className = 'card'
    formCard.innerHTML = `
        <h2>Agendar Nueva Cita</h2>
        <form id="add-appointment-form">
            <div>
                <label for="patient-name">Nombre del Paciente</label>
                <input type="text" id="patient-name" required placeholder="Ej: Juan Pérez">
            </div>
            <div>
                <label for="doctor-name">Nombre del Doctor</label>
                <select id="doctor-name" required>
                    <option value="">Seleccione...</option>
                    <option value="Dr. Lizardo">Dr. Lizardo (Cardiología)</option>
                    <option value="Dra. Perla">Dra. Perla (Pediatría)</option>
                    <option value="Dr. Endy">Dr. Endy (Medicina General)</option>
                </select>
            </div>
            <div>
                <label for="appointment-date">Fecha</label>
                <input type="date" id="appointment-date" required>
            </div>
            <div>
                <label for="appointment-time">Hora</label>
                <input type="time" id="appointment-time" required>
            </div>
            <button type="submit" style="width: 100%;">Confirmar Cita</button>
        </form>
    `
    formCard.querySelector('#add-appointment-form').addEventListener('submit', handleAddAppointment)
    return formCard
}

const createListUI = () => {
    const listCard = document.createElement('div')
    listCard.className = 'card'
    listCard.innerHTML = '<h2>Próximas Citas</h2>'

    ELEMENTS.appointmentList = document.createElement('div')
    ELEMENTS.appointmentList.className = 'appointment-list'
    listCard.appendChild(ELEMENTS.appointmentList)
    return listCard
}

const initApp = async () => {
    const mainContainer = document.createElement('div')
    mainContainer.className = 'main-container'

    mainContainer.appendChild(createFormUI())
    mainContainer.appendChild(createListUI())

    ELEMENTS.app.appendChild(mainContainer)

    APP_STATE.appointments = await fetchData()
    APP_STATE.appointments.sort((a, b) => a.timestamp - b.timestamp)
    renderAppointments()

    const today = new Date().toISOString().split('T')[0]
    document.getElementById('appointment-date').setAttribute('min', today)
}

window.onload = initApp