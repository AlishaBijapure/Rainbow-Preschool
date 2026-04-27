const API_BASE = '/api';

let currentStudents = [];
let currentEnquiries = [];

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initForms();
    initModals();

    loadStudents();
    loadFeeSettings();
    fetchEnquiries();
});

function initNavigation() {
    const sidebar = document.getElementById('adminSidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    const setSidebarOpen = isOpen => {
        if (!sidebar || !sidebarToggle || !sidebarOverlay) return;
        sidebar.classList.toggle('is-open', isOpen);
        document.body.classList.toggle('sidebar-open', isOpen);
        sidebarToggle.setAttribute('aria-expanded', String(isOpen));
        sidebarOverlay.hidden = !isOpen;
    };

    sidebarToggle?.addEventListener('click', () => {
        setSidebarOpen(!sidebar?.classList.contains('is-open'));
    });

    sidebarOverlay?.addEventListener('click', () => setSidebarOpen(false));

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', event => {
            const tabId = event.currentTarget.getAttribute('data-tab');
            switchTab(tabId);
            setSidebarOpen(false);
        });
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 1120) setSidebarOpen(false);
    });
}

function initForms() {
    document.getElementById('addStudentForm')?.addEventListener('submit', handleAddStudent);
    document.getElementById('feeCollectionForm')?.addEventListener('submit', handleFeeCollection);
}

function initModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', event => {
            if (event.target === modal) closeModal(modal.id);
        });
    });

    document.addEventListener('keydown', event => {
        if (event.key !== 'Escape') return;
        document.querySelectorAll('.modal.show').forEach(modal => closeModal(modal.id));
    });
}

function switchTab(tabId) {
    if (!tabId) return;

    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

    document.getElementById(tabId)?.classList.add('active');
    const activeBtn = document.querySelector(`[data-tab="${tabId}"]`);
    activeBtn?.classList.add('active');

    const titleEl = document.getElementById('currentViewTitle');
    const subtitleEl = document.getElementById('currentViewSubtitle');
    if (activeBtn && titleEl && subtitleEl) {
        titleEl.textContent = activeBtn.dataset.title || activeBtn.textContent.trim();
        subtitleEl.textContent = activeBtn.dataset.subtitle || '';
    }

    if (tabId === 'dashboard') loadStudents();
    if (tabId === 'fee-settings') loadFeeSettings();
    if (tabId === 'enquiries') fetchEnquiries();
}

function calculateAge() {
    const dobInput = document.getElementById('sDob')?.value;
    const ageInput = document.getElementById('sAge');
    if (!dobInput || !ageInput) return;

    const dob = new Date(dobInput);
    const today = new Date();

    let years = today.getFullYear() - dob.getFullYear();
    let months = today.getMonth() - dob.getMonth();

    if (months < 0 || (months === 0 && today.getDate() < dob.getDate())) {
        years--;
        months += 12;
    }

    if (today.getDate() < dob.getDate()) {
        months--;
    }

    ageInput.value = `${years} Years, ${Math.max(months, 0)} Months`;
}

function copyAddress() {
    const tempAddr = document.getElementById('tempAddr');
    const permAddr = document.getElementById('permAddr');
    if (tempAddr && permAddr) tempAddr.value = permAddr.value;
}

function getActiveYear() {
    return document.getElementById('globalAcademicYear')?.value || '2026-27';
}

function onAcademicYearChange() {
    loadFeeSettings();
    loadStudents();
}

async function loadFeeSettings() {
    try {
        const response = await fetch(`${API_BASE}/fees?academicYear=${encodeURIComponent(getActiveYear())}`);
        const fees = await response.json();

        ['feePlaygroup', 'feeNursery', 'feeLKG', 'feeUKG'].forEach(id => {
            const input = document.getElementById(id);
            if (input) input.value = '';
        });

        if (!Array.isArray(fees)) return;

        fees.forEach(fee => {
            const fieldMap = {
                Playgroup: 'feePlaygroup',
                Nursery: 'feeNursery',
                LKG: 'feeLKG',
                UKG: 'feeUKG'
            };

            const input = document.getElementById(fieldMap[fee.classLevel]);
            if (input) input.value = fee.baseFee;
        });
    } catch (error) {
        console.error('Error loading fees', error);
    }
}

async function saveFeeSettings() {
    const classes = [
        { level: 'Playgroup', id: 'feePlaygroup' },
        { level: 'Nursery', id: 'feeNursery' },
        { level: 'LKG', id: 'feeLKG' },
        { level: 'UKG', id: 'feeUKG' }
    ];

    try {
        for (const cls of classes) {
            const val = document.getElementById(cls.id)?.value;
            if (!val) continue;

            await fetch(`${API_BASE}/fees`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    classLevel: cls.level,
                    baseFee: Number(val),
                    academicYear: getActiveYear()
                })
            });
        }

        alert('Fee settings saved successfully.');
    } catch (error) {
        alert('Error saving fee settings.');
        console.error(error);
    }
}

async function handleAddStudent(event) {
    event.preventDefault();

    const isCustom = document.getElementById('sIsCustom')?.checked;

    const payload = {
        academicYear: getActiveYear(),
        firstName: getValue('sfName'),
        lastName: getValue('slName'),
        dob: getValue('sDob'),
        classAdmitted: getValue('sClass'),
        concession: Number(getValue('sConcession')) || 0,
        admissionType: isCustom ? 'Custom' : 'Normal',
        customStartDate: isCustom ? getValue('sCustomStart') : null,
        customEndDate: isCustom ? getValue('sCustomEnd') : null,
        customBaseFee: isCustom ? Number(getValue('sCustomFee')) : null,
        motherDetails: {
            name: getValue('mName'),
            phone: getValue('mPhone'),
            occupation: getValue('mOcc'),
            education: getValue('mEdu')
        },
        fatherDetails: {
            name: getValue('fName'),
            phone: getValue('fPhone'),
            occupation: getValue('fOcc'),
            education: getValue('fEdu')
        },
        permanentAddress: getValue('permAddr'),
        tempAddress: getValue('tempAddr')
    };

    try {
        const response = await fetch(`${API_BASE}/students`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || 'Submission failed');
        }

        alert('Student admitted successfully.');
        event.target.reset();
        toggleCustomAdmission();
        switchTab('dashboard');
    } catch (error) {
        console.error('Error adding student', error);
        alert(error.message || 'Submission failed.');
    }
}

async function loadStudents() {
    try {
        const response = await fetch(`${API_BASE}/students?academicYear=${encodeURIComponent(getActiveYear())}`);
        currentStudents = await response.json();
        if (!Array.isArray(currentStudents)) currentStudents = [];
        applyFilters();
    } catch (error) {
        currentStudents = [];
        applyFilters();
        console.error('Error loading students', error);
    }
}

function applyFilters() {
    const classFilter = getValue('filterClass') || 'All';
    const pendingFilter = document.getElementById('filterPending')?.checked;
    const customFilter = document.getElementById('filterCustom')?.checked;
    const searchFilter = getValue('searchName').toLowerCase().trim();

    let filtered = currentStudents;

    if (searchFilter) {
        filtered = filtered.filter(student => {
            const fullName = `${student.firstName || ''} ${student.lastName || ''}`.toLowerCase();
            return fullName.includes(searchFilter);
        });
    }

    if (classFilter !== 'All') {
        filtered = filtered.filter(student => student.classAdmitted === classFilter);
    }

    if (customFilter) {
        filtered = filtered.filter(student => student.admissionType === 'Custom');
    }

    const tbody = document.querySelector('#studentsTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    let renderedCount = 0;

    filtered.forEach(student => {
        const baseFee = Number(student.fees?.baseFeeAtAdmission) || 0;
        const concession = Number(student.fees?.concession) || 0;
        const totalPaid = student.fees?.installments?.reduce((sum, inst) => sum + Number(inst.amountPaid || 0), 0) || 0;
        const netFee = baseFee - concession;
        const balance = netFee - totalPaid;

        if (pendingFilter && balance <= 0) return;

        renderedCount++;
        const dob = safeDate(student.dob);
        const age = getAgeLabel(dob);
        const tr = document.createElement('tr');
        tr.addEventListener('click', () => openProfileModal(student));

        tr.innerHTML = `
            <td><strong>${escapeHtml(student.firstName)} ${escapeHtml(student.lastName)}</strong></td>
            <td>${escapeHtml(student.classAdmitted)}</td>
            <td>${formatDate(dob)} <span class="small-note">${age}</span></td>
            <td>
                ${formatCurrency(baseFee)}
                ${concession > 0 ? `<span class="small-note">-${formatCurrency(concession)} concession</span>` : ''}
            </td>
            <td><span class="amount-positive">${formatCurrency(totalPaid)}</span></td>
            <td><span class="${balance > 0 ? 'amount-negative' : 'amount-positive'}">${formatCurrency(balance)}</span></td>
            <td>
                <button class="btn btn-sm btn-outline" type="button" data-fee-button>Add Fee</button>
            </td>
        `;

        const feeButton = tr.querySelector('[data-fee-button]');
        feeButton?.addEventListener('click', event => {
            event.stopPropagation();
            openFeeModal(student._id, `${student.firstName || ''} ${student.lastName || ''}`.trim(), balance);
        });

        tbody.appendChild(tr);
    });

    if (renderedCount === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-row">No students match the selected filters.</td></tr>';
    }
}

function toggleCustomAdmission() {
    const isCustom = document.getElementById('sIsCustom')?.checked;
    const fieldsDiv = document.getElementById('customAdmissionFields');
    if (!fieldsDiv) return;

    fieldsDiv.hidden = !isCustom;

    ['sCustomStart', 'sCustomEnd', 'sCustomFee'].forEach(id => {
        const input = document.getElementById(id);
        if (input) input.required = Boolean(isCustom);
    });
}

function openFeeModal(studentId, studentName, balance) {
    document.getElementById('fcStudentId').value = studentId;
    document.getElementById('feeModalStudentInfo').textContent = `Recording payment for ${studentName}. Remaining Balance: ${formatCurrency(balance)}`;
    document.getElementById('fcAmount').value = balance > 0 ? balance : 0;
    document.getElementById('fcDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('feeModal')?.classList.add('show');
}

function closeModal(modalId) {
    document.getElementById(modalId)?.classList.remove('show');
    if (modalId === 'feeModal') document.getElementById('feeCollectionForm')?.reset();
    if (modalId === 'profileModal') toggleEditProfile(true);
}

async function handleFeeCollection(event) {
    event.preventDefault();

    const studentId = getValue('fcStudentId');
    const payload = {
        amountPaid: Number(getValue('fcAmount')),
        date: getValue('fcDate'),
        payerName: getValue('fcPayer'),
        receiverName: getValue('fcReceiver'),
        paymentMode: getValue('fcPaymentMode') || 'Cash'
    };

    try {
        const response = await fetch(`${API_BASE}/students/${studentId}/fees`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || 'Failed to record payment');
        }

        alert('Payment recorded successfully.');
        closeModal('feeModal');
        loadStudents();
    } catch (error) {
        console.error(error);
        alert(error.message || 'Failed to record payment.');
    }
}

function openProfileModal(student) {
    document.getElementById('profId').value = student._id;
    document.getElementById('profName').textContent = `${student.firstName || ''} ${student.lastName || ''} Profile`.trim();

    const admissionType = student.admissionType || 'Normal';
    const badge = document.getElementById('profAdmissionBadge');
    if (badge) {
        badge.textContent = `${admissionType} Admission`;
        badge.className = `profile-badge ${admissionType === 'Custom' ? 'is-custom' : ''}`.trim();
    }

    setValue('pAdmissionType', admissionType);
    setValue('pCustomStart', student.customStartDate ? new Date(student.customStartDate).toISOString().split('T')[0] : '');
    setValue('pCustomEnd', student.customEndDate ? new Date(student.customEndDate).toISOString().split('T')[0] : '');
    setValue('pCustomFee', student.fees?.baseFeeAtAdmission || 0);
    setValue('pConcession', student.fees?.concession || 0);
    toggleProfileCustomFields();

    setValue('pFirstName', student.firstName || '');
    setValue('pLastName', student.lastName || '');
    setValue('pClass', student.classAdmitted || '');
    setValue('pDob', student.dob ? new Date(student.dob).toISOString().split('T')[0] : '');

    setValue('pMName', student.motherDetails?.name || '');
    setValue('pMPhone', student.motherDetails?.phone || '');
    setValue('pMOcc', student.motherDetails?.occupation || '');
    setValue('pMEdu', student.motherDetails?.education || '');

    setValue('pFName', student.fatherDetails?.name || '');
    setValue('pFPhone', student.fatherDetails?.phone || '');
    setValue('pFOcc', student.fatherDetails?.occupation || '');
    setValue('pFEdu', student.fatherDetails?.education || '');

    setValue('pPAddr', student.permanentAddress || '');
    setValue('pTAddr', student.tempAddress || '');

    renderInstallments(student.fees?.installments || []);
    toggleEditProfile(true);
    document.getElementById('profileModal')?.classList.add('show');
}

function renderInstallments(installments) {
    const tbody = document.querySelector('#profInstallmentsTable tbody');
    if (!tbody) return;

    if (!installments.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-row">No payments recorded.</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    installments.forEach(inst => {
        const row = document.createElement('tr');
        const mode = inst.paymentMode || 'Cash';

        row.innerHTML = `
            <td>${formatDate(safeDate(inst.date))}</td>
            <td><span class="amount-positive">${formatCurrency(inst.amountPaid)}</span></td>
            <td>${escapeHtml(inst.payerName)}</td>
            <td>${escapeHtml(inst.receiverName)}</td>
            <td><span class="badge ${mode === 'Online' ? 'bg-primary' : 'bg-secondary'}">${escapeHtml(mode)}</span></td>
        `;

        tbody.appendChild(row);
    });
}

function toggleProfileCustomFields() {
    const isCustom = getValue('pAdmissionType') === 'Custom';
    document.querySelectorAll('.pCustomGroup').forEach(group => {
        group.hidden = !isCustom;
        const input = group.querySelector('input');
        if (input) input.required = isCustom;
    });
}

function toggleEditProfile(forceOff = false) {
    const firstNameInput = document.getElementById('pFirstName');
    const isCurrentlyEditing = firstNameInput ? firstNameInput.readOnly === false : false;
    const shouldEdit = forceOff ? false : !isCurrentlyEditing;

    [
        'pFirstName', 'pLastName', 'pDob', 'pMName', 'pMPhone', 'pMOcc', 'pMEdu',
        'pFName', 'pFPhone', 'pFOcc', 'pFEdu', 'pPAddr', 'pTAddr',
        'pCustomStart', 'pCustomEnd', 'pCustomFee', 'pConcession'
    ].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.readOnly = !shouldEdit;
    });

    const classSelect = document.getElementById('pClass');
    const admissionSelect = document.getElementById('pAdmissionType');
    if (classSelect) classSelect.disabled = !shouldEdit;
    if (admissionSelect) admissionSelect.disabled = !shouldEdit;

    const saveContainer = document.getElementById('profSaveContainer');
    const editButton = document.getElementById('btnEditProf');
    if (saveContainer) saveContainer.hidden = !shouldEdit;
    if (editButton) editButton.hidden = shouldEdit;
}

async function saveProfileChanges() {
    const studentId = getValue('profId');
    const admissionType = getValue('pAdmissionType');

    const payload = {
        firstName: getValue('pFirstName'),
        lastName: getValue('pLastName'),
        dob: getValue('pDob'),
        classAdmitted: getValue('pClass'),
        admissionType,
        motherDetails: {
            name: getValue('pMName'),
            phone: getValue('pMPhone'),
            occupation: getValue('pMOcc'),
            education: getValue('pMEdu')
        },
        fatherDetails: {
            name: getValue('pFName'),
            phone: getValue('pFPhone'),
            occupation: getValue('pFOcc'),
            education: getValue('pFEdu')
        },
        permanentAddress: getValue('pPAddr'),
        tempAddress: getValue('pTAddr'),
        updateConcession: Number(getValue('pConcession')) || 0
    };

    if (admissionType === 'Custom') {
        payload.customStartDate = getValue('pCustomStart');
        payload.customEndDate = getValue('pCustomEnd');
        payload.baseFeeAtAdmission = Number(getValue('pCustomFee'));
    } else {
        payload.customStartDate = null;
        payload.customEndDate = null;
    }

    try {
        const response = await fetch(`${API_BASE}/students/${studentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error('Error updating profile');

        alert('Profile updated successfully.');
        closeModal('profileModal');
        loadStudents();
    } catch (error) {
        console.error(error);
        alert('Failed to update profile.');
    }
}

async function deleteStudent() {
    const studentId = getValue('profId');
    const confirmDelete = confirm('Are you sure you want to permanently delete this student? This action cannot be undone.');
    if (!confirmDelete) return;

    try {
        const response = await fetch(`${API_BASE}/students/${studentId}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Error deleting student');

        alert('Student deleted entirely.');
        closeModal('profileModal');
        loadStudents();
    } catch (error) {
        console.error(error);
        alert('Failed to delete student.');
    }
}

async function fetchEnquiries() {
    try {
        const response = await fetch(`${API_BASE}/enquiries`);
        currentEnquiries = await response.json();
        if (!Array.isArray(currentEnquiries)) currentEnquiries = [];
        renderEnquiries();
    } catch (error) {
        currentEnquiries = [];
        renderEnquiries();
        console.error('Error fetching enquiries:', error);
    }
}

function renderEnquiries() {
    const tbody = document.querySelector('#enquiriesTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!currentEnquiries.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-row">No enquiries received yet.</td></tr>';
        return;
    }

    currentEnquiries.forEach(enquiry => {
        const date = safeDate(enquiry.createdAt);
        const tr = document.createElement('tr');
        const isContacted = Boolean(enquiry.contacted);

        tr.innerHTML = `
            <td>
                <strong>${formatDate(date)}</strong>
                <span class="small-note">${formatTime(date)}</span>
            </td>
            <td><strong>${escapeHtml(enquiry.parentName)}</strong></td>
            <td>${escapeHtml(enquiry.childAge)} yrs</td>
            <td><a href="tel:${escapeAttribute(enquiry.phone)}">${escapeHtml(enquiry.phone)}</a></td>
            <td>
                <div class="enquiry-actions">
                    <div class="contact-toggle">
                        <button class="switch-track ${isContacted ? 'is-on' : ''}" type="button" onclick="toggleEnquiryContacted('${escapeAttribute(enquiry._id)}', ${!isContacted})" title="${isContacted ? 'Mark as Pending' : 'Mark as Contacted'}">
                            <span class="switch-thumb"></span>
                        </button>
                        <span class="status-label ${isContacted ? 'is-contacted' : ''}">${isContacted ? 'Contacted' : 'Pending'}</span>
                    </div>
                    <button class="icon-btn danger" type="button" onclick="deleteEnquiry('${escapeAttribute(enquiry._id)}')" title="Delete Enquiry">
                        <span class="material-symbols-rounded">delete</span>
                    </button>
                </div>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

async function deleteEnquiry(id) {
    if (!confirm('Are you sure you want to permanently delete this enquiry?')) return;

    try {
        const response = await fetch(`${API_BASE}/enquiries/${id}`, { method: 'DELETE' });
        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.error || 'Failed to delete enquiry');
        }

        fetchEnquiries();
    } catch (error) {
        console.error('Error deleting enquiry:', error);
        alert(error.message || 'Failed to delete enquiry.');
    }
}

async function toggleEnquiryContacted(id, status) {
    try {
        const response = await fetch(`${API_BASE}/enquiries/${id}/toggle-contacted`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contacted: status })
        });

        if (!response.ok) throw new Error('Failed to toggle status');
        fetchEnquiries();
    } catch (error) {
        console.error('Error toggling enquiry:', error);
    }
}

function getValue(id) {
    return document.getElementById(id)?.value || '';
}

function setValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
}

function safeDate(value) {
    const date = value ? new Date(value) : new Date('');
    return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(date) {
    return date ? date.toLocaleDateString() : '-';
}

function formatTime(date) {
    return date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-';
}

function getAgeLabel(dob) {
    if (!dob) return '';

    const today = new Date();
    let ageYears = today.getFullYear() - dob.getFullYear();
    let ageMonths = today.getMonth() - dob.getMonth();

    if (ageMonths < 0 || (ageMonths === 0 && today.getDate() < dob.getDate())) {
        ageYears--;
        ageMonths += 12;
    }

    return `(${ageYears}y ${Math.max(ageMonths, 0)}m)`;
}

function formatCurrency(value) {
    const amount = Number(value) || 0;
    return `Rs. ${amount.toLocaleString('en-IN')}`;
}

function escapeHtml(value = '') {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function escapeAttribute(value = '') {
    return escapeHtml(value).replace(/`/g, '&#096;');
}
