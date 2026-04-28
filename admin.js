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
    document.getElementById('addSizeForm')?.addEventListener('submit', handleAddSize);
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
    if (tabId === 'uniform' || tabId === 'add-student') loadUniforms();
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

let studentPhotoBase64 = null;
let profilePhotoBase64 = null;

async function previewPhoto(event, targetId, isProfile = false) {
    const file = event.target.files[0];
    if (!file) return;

    // Limit to 2MB for safety
    if (file.size > 2 * 1024 * 1024) {
        alert('Photo is too large. Please select a photo smaller than 2MB.');
        event.target.value = '';
        return;
    }

    try {
        const base64 = await readAsBase64(file);
        if (isProfile) {
            profilePhotoBase64 = base64;
            const img = document.getElementById('pPhotoImg');
            const placeholder = document.getElementById('pPhotoPlaceholder');
            if (img && placeholder) {
                img.src = base64;
                img.style.display = 'block';
                placeholder.style.display = 'none';
            }
        } else {
            studentPhotoBase64 = base64;
            const container = document.getElementById(targetId);
            if (container) {
                container.innerHTML = `<img src="${base64}" style="width: 100%; height: 100%; object-fit: cover;">`;
            }
        }
    } catch (error) {
        console.error('Error reading photo', error);
        alert('Failed to read photo.');
    }
}

function readAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
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
        tempAddress: getValue('tempAddr'),
        photo: studentPhotoBase64
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
        studentPhotoBase64 = null;
        const preview = document.getElementById('sPhotoPreview');
        if (preview) preview.innerHTML = '<span class="material-symbols-rounded">add_a_photo</span>';
        
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
    const concessionFilter = document.getElementById('filterConcession')?.checked;
    const searchFilter = getValue('searchName').toLowerCase().trim();

    const badge = document.getElementById('classFilterBaseFee');
    if (badge) {
        if (classFilter !== 'All') {
            const fieldMap = {
                Playgroup: 'feePlaygroup',
                Nursery: 'feeNursery',
                LKG: 'feeLKG',
                UKG: 'feeUKG'
            };
            const feeVal = document.getElementById(fieldMap[classFilter])?.value;
            if (feeVal) {
                badge.textContent = `Base Fee: ${formatCurrency(feeVal)}`;
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }
        } else {
            badge.style.display = 'none';
        }
    }

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

    if (concessionFilter) {
        filtered = filtered.filter(student => Number(student.fees?.concession) > 0);
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
        tbody.innerHTML = '<tr><td colspan="6" class="empty-row">No students match the selected filters.</td></tr>';
    }

    const countBadge = document.getElementById('studentCountBadge');
    if (countBadge) {
        countBadge.textContent = `${renderedCount} Selected`;
    }
}

function toggleCustomAdmission() {
    const isCustom = document.getElementById('sIsCustom')?.checked;
    const fieldsDiv = document.getElementById('customAdmissionFields');
    if (!fieldsDiv) return;

    fieldsDiv.style.display = isCustom ? 'grid' : 'none';

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
        receiptNumber: getValue('fcReceiptNo'),
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

    // Profile Photo
    const profImg = document.getElementById('pPhotoImg');
    const profPlaceholder = document.getElementById('pPhotoPlaceholder');
    profilePhotoBase64 = null; // Reset for this profile
    
    if (student.photo) {
        if (profImg && profPlaceholder) {
            profImg.src = student.photo;
            profImg.style.display = 'block';
            profPlaceholder.style.display = 'none';
        }
    } else {
        if (profImg && profPlaceholder) {
            profImg.src = '';
            profImg.style.display = 'none';
            profPlaceholder.style.display = 'block';
        }
    }

    renderInstallments(student.fees?.installments || []);
    toggleEditProfile(true);
    document.getElementById('profileModal')?.classList.add('show');
}

function renderInstallments(installments) {
    const tbody = document.querySelector('#profInstallmentsTable tbody');
    if (!tbody) return;

    if (!installments.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-row">No payments recorded.</td></tr>';
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
            <td><strong>${escapeHtml(inst.receiptNumber || '-')}</strong></td>
            <td><span class="badge ${mode === 'Online' ? 'bg-primary' : 'bg-secondary'}">${escapeHtml(mode)}</span></td>
        `;

        tbody.appendChild(row);
    });
}

function toggleProfileCustomFields() {
    const isCustom = getValue('pAdmissionType') === 'Custom';
    document.querySelectorAll('.pCustomGroup').forEach(group => {
        group.style.display = isCustom ? 'block' : 'none';
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
    if (saveContainer) saveContainer.style.display = shouldEdit ? 'block' : 'none';
    if (editButton) editButton.style.display = shouldEdit ? 'none' : 'block';

    const photoActions = document.getElementById('pPhotoUploadActions');
    if (photoActions) photoActions.style.display = shouldEdit ? 'block' : 'none';

    const form = document.getElementById('profileForm');
    if (form) {
        if (shouldEdit) {
            form.classList.remove('is-viewing');
        } else {
            form.classList.add('is-viewing');
        }
    }
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

    if (profilePhotoBase64) {
        payload.photo = profilePhotoBase64;
    }

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

let currentUniforms = [];

async function loadUniforms() {
    try {
        const response = await fetch(`${API_BASE}/uniforms`);
        currentUniforms = await response.json();
        if (!Array.isArray(currentUniforms)) currentUniforms = [];
        renderUniforms();
    } catch (error) {
        currentUniforms = [];
        renderUniforms();
        console.error('Error loading uniforms', error);
    }
}

function renderUniforms() {
    const categories = {
        'Girls Uniform': [document.getElementById('girlsUniformContainer'), document.getElementById('girlsUniformContainerAdmission')],
        'Boys Uniform': [document.getElementById('boysUniformContainer'), document.getElementById('boysUniformContainerAdmission')],
        'Sports Uniform': [document.getElementById('sportsUniformContainer'), document.getElementById('sportsUniformContainerAdmission')]
    };

    for (const key in categories) {
        categories[key].forEach(container => {
            if (container) container.innerHTML = '';
        });
    }

    const grouped = {
        'Girls Uniform': [],
        'Boys Uniform': [],
        'Sports Uniform': []
    };

    currentUniforms.forEach(item => {
        if (grouped[item.category]) {
            grouped[item.category].push(item);
        }
    });

    for (const category in grouped) {
        const containers = categories[category];
        
        const itemsByType = {};
        grouped[category].forEach(item => {
            if (!itemsByType[item.itemType]) {
                itemsByType[item.itemType] = [];
            }
            itemsByType[item.itemType].push(item);
        });

        containers.forEach(container => {
            if (!container) return;

            if (grouped[category].length === 0) {
                container.innerHTML = '<div class="empty-row" style="padding: 20px; text-align: center; color: var(--text-muted); font-style: italic;">No items found.</div>';
                return;
            }

            for (const itemType in itemsByType) {
                itemsByType[itemType].sort((a, b) => parseFloat(a.size) - parseFloat(b.size) || a.size.localeCompare(b.size));

                let icon = 'checkroom';
                if (itemType.toLowerCase().includes('skirt')) icon = 'apparel';
                if (itemType.toLowerCase().includes('pant')) icon = 'straighten';
                if (itemType.toLowerCase().includes('t-shirt')) icon = 'apparel';
                if (itemType.toLowerCase().includes('shirt')) icon = 'checkroom';

                const details = document.createElement('details');
                details.className = 'uniform-accordion';
                details.style.marginBottom = '10px';
                details.style.border = '1px solid var(--border)';
                details.style.borderRadius = 'var(--radius-md)';
                details.style.background = 'var(--surface)';
                details.style.overflow = 'hidden';

                let rowsHtml = '';
                itemsByType[itemType].forEach(item => {
                    const isZero = item.count === 0;
                    const rowStyle = isZero ? 'border-bottom: 1px solid var(--border); background: rgba(239, 68, 68, 0.05);' : 'border-bottom: 1px solid var(--border);';
                    const badgeStyle = isZero ? 'background: rgba(239, 68, 68, 0.1); color: var(--danger); padding: 4px 8px; border-radius: 4px; font-weight: 600;' : 'background: rgba(157, 113, 232, 0.1); color: var(--purple); padding: 4px 8px; border-radius: 4px; font-weight: 600;';
                    const inputStyle = isZero ? 'width: 60px; padding: 4px; border-radius: 6px; border: 1px solid var(--danger); font-family: var(--font-body); font-weight: 600; text-align: center; color: var(--danger);' : 'width: 60px; padding: 4px; border-radius: 6px; border: 1px solid var(--border); font-family: var(--font-body); font-weight: 600; text-align: center;';

                    rowsHtml += `
                        <tr style="${rowStyle}">
                            <td style="padding: 10px;">
                                <span class="badge" style="${badgeStyle}">${escapeHtml(item.size)}</span>
                            </td>
                            <td style="padding: 10px;">
                                <div style="display: flex; align-items: center; gap: 5px;">
                                    <button class="btn btn-sm btn-outline" style="padding: 2px 8px; font-weight: 700;" onclick="adjustStock('${escapeAttribute(item.category)}', '${escapeAttribute(item.itemType)}', '${escapeAttribute(item.size)}', -1, this)">-</button>
                                    <input type="number" value="${item.count}" min="0" 
                                        style="${inputStyle}"
                                        onchange="updateStockCount('${escapeAttribute(item.category)}', '${escapeAttribute(item.itemType)}', '${escapeAttribute(item.size)}', this.value)">
                                    <button class="btn btn-sm btn-outline" style="padding: 2px 8px; font-weight: 700;" onclick="adjustStock('${escapeAttribute(item.category)}', '${escapeAttribute(item.itemType)}', '${escapeAttribute(item.size)}', 1, this)">+</button>
                                </div>
                            </td>
                        </tr>
                    `;
                });

                details.innerHTML = `
                    <summary style="padding: 15px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: space-between; background: var(--bg-light); list-style: none;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span class="material-symbols-rounded" style="color: var(--purple);">${icon}</span>
                            <span>${escapeHtml(itemType)}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <button class="btn-delete" style="background: none; border: none; color: var(--danger); cursor: pointer; display: flex; align-items: center; padding: 5px; border-radius: 50%; transition: background 0.2s;" 
                                onclick="event.stopPropagation(); deleteItemType('${escapeAttribute(category)}', '${escapeAttribute(itemType)}')">
                                <span class="material-symbols-rounded" style="font-size: 20px;">delete</span>
                            </button>
                            <span class="material-symbols-rounded expand-icon" style="transition: transform 0.3s;">expand_more</span>
                        </div>
                    </summary>
                    <div class="accordion-content" style="padding: 15px; border-top: 1px solid var(--border);">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="text-align: left; color: var(--text-muted); font-size: 0.9rem;">
                                    <th style="padding: 8px;">Size</th>
                                    <th style="padding: 8px;">Stock Count</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rowsHtml}
                            </tbody>
                        </table>
                    </div>
                `;

                details.addEventListener('toggle', () => {
                    const icon = details.querySelector('.expand-icon');
                    if (icon) {
                        icon.style.transform = details.open ? 'rotate(180deg)' : 'rotate(0deg)';
                    }
                });

                container.appendChild(details);
            }
        });
    }
}

async function deleteItemType(category, itemType) {
    if (!confirm(`Are you sure you want to delete all sizes for ${itemType} in ${category}?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/uniforms`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category, itemType })
        });

        if (!response.ok) throw new Error('Failed to delete item type');

        alert('Item type deleted successfully.');
        loadUniforms();
    } catch (error) {
        console.error(error);
        alert('Failed to delete item type.');
    }
}

function adjustStock(category, itemType, size, change, buttonEl) {
    const parent = buttonEl.parentElement;
    const input = parent.querySelector('input[type="number"]');
    if (!input) return;

    let currentVal = Number(input.value) || 0;
    let newVal = currentVal + change;
    if (newVal < 0) newVal = 0;

    input.value = newVal;
    updateStockCount(category, itemType, size, newVal);
}

async function updateStockCount(category, itemType, size, newCount) {
    try {
        const response = await fetch(`${API_BASE}/uniforms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                category,
                itemType,
                size,
                count: Number(newCount)
            })
        });

        if (!response.ok) throw new Error('Failed to update stock count');
    } catch (error) {
        console.error(error);
        alert('Failed to update stock count.');
        loadUniforms();
    }
}

function openAddSizeModal() {
    document.getElementById('addSizeModal')?.classList.add('show');
}

async function handleAddSize(event) {
    event.preventDefault();

    const payload = {
        category: getValue('uniformCategory'),
        itemType: getValue('uniformItemType'),
        size: getValue('uniformSize').trim(),
        count: Number(getValue('uniformCount')) || 0
    };

    if (!payload.size) {
        alert('Size is required.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/uniforms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error('Failed to add size');

        alert('Size added successfully.');
        closeModal('addSizeModal');
        document.getElementById('addSizeForm')?.reset();
        loadUniforms();
    } catch (error) {
        console.error(error);
        alert('Failed to add size.');
    }
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
