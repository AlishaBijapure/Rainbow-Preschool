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
    document.getElementById('addActivityForm')?.addEventListener('submit', handleAddActivity);
    document.getElementById('celebrationForm')?.addEventListener('submit', handleAddCelebration);
    document.getElementById('editCelebrationForm')?.addEventListener('submit', handleEditCelebration);

    ['permAddr', 'tempAddr', 'pPAddr', 'pTAddr'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = (this.scrollHeight + 5) + 'px';
            });
        }
    });
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
    if (tabId === 'fee-receipts') loadFeeReceipts();
    if (tabId === 'activities') {
        loadActivities();
        generateWinnerInputs(); // initial load
    }
    if (tabId === 'celebrations') {
        loadCelebrations();
    }
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
            openCropModal(base64, true);
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

let cropper = null;
let currentCropTarget = null;

function openCropModal(base64, isProfileTarget) {
    currentCropTarget = isProfileTarget;
    const imageToCrop = document.getElementById('imageToCrop');
    imageToCrop.src = base64;
    document.getElementById('cropModal').classList.add('show');
    
    if (cropper) {
        cropper.destroy();
    }
    
    // We need a slight delay for the modal to display properly before initializing cropper
    setTimeout(() => {
        cropper = new Cropper(imageToCrop, {
            aspectRatio: 1,
            viewMode: 1,
            autoCropArea: 1,
        });
    }, 100);
}

function cropImage() {
    if (!cropper) return;
    const canvas = cropper.getCroppedCanvas({
        width: 300,
        height: 300
    });
    
    const croppedBase64 = canvas.toDataURL('image/jpeg', 0.8);
    
    if (currentCropTarget) {
        profilePhotoBase64 = croppedBase64;
        const img = document.getElementById('pPhotoImg');
        const placeholder = document.getElementById('pPhotoPlaceholder');
        if (img && placeholder) {
            img.src = croppedBase64;
            img.style.display = 'block';
            placeholder.style.display = 'none';
        }
    } else {
        studentPhotoBase64 = croppedBase64;
        const container = document.getElementById('sPhotoWrapper');
        if (container) {
            container.innerHTML = `<img src="${croppedBase64}" style="width: 100%; height: 100%; object-fit: cover;">`;
        }
    }
    
    closeModal('cropModal');
}

function getActiveYear() {
    return document.getElementById('globalAcademicYear')?.value || '2026-27';
}

function onAcademicYearChange() {
    loadFeeSettings();
    refreshActiveTab();
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
            <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                    ${student.photo ? `<img src="${student.photo}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">` : `<div style="width: 40px; height: 40px; border-radius: 50%; background: rgba(157, 113, 232, 0.1); display: flex; align-items: center; justify-content: center; color: var(--purple); font-weight: bold;">${escapeHtml(student.firstName).charAt(0)}${escapeHtml(student.lastName).charAt(0)}</div>`}
                    <strong>${escapeHtml(student.firstName)} ${escapeHtml(student.lastName)}</strong>
                </div>
            </td>
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
    document.getElementById('fcPayer').value = studentName;
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
        refreshActiveTab();
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

    setTimeout(() => {
        ['pPAddr', 'pTAddr'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.style.height = 'auto';
                el.style.height = (el.scrollHeight + 5) + 'px';
            }
        });
    }, 50);

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

    setTimeout(() => {
        ['pPAddr', 'pTAddr'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.style.height = 'auto';
                el.style.height = (el.scrollHeight + 5) + 'px';
            }
        });
    }, 50);
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
        refreshActiveTab();
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
        refreshActiveTab();
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

    const showPendingOnly = document.getElementById('pendingEnquiriesFilter')?.checked || false;

    let filteredEnquiries = currentEnquiries;
    if (showPendingOnly) {
        filteredEnquiries = currentEnquiries.filter(enquiry => !enquiry.contacted);
    }

    const countBadge = document.getElementById('enquiriesCountBadge');
    if (countBadge) {
        countBadge.textContent = filteredEnquiries.length;
    }

    if (!filteredEnquiries.length) {
        tbody.innerHTML = `<tr><td colspan="5" class="empty-row">${showPendingOnly ? 'No pending enquiries found.' : 'No enquiries received yet.'}</td></tr>`;
        return;
    }

    filteredEnquiries.forEach(enquiry => {
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
        'Girls Uniform': [document.getElementById('girlsUniformContainer')],
        'Boys Uniform': [document.getElementById('boysUniformContainer')],
        'Sports Uniform': [document.getElementById('sportsUniformContainer')]
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
                            <td style="padding: 10px; text-align: right;">
                                <button class="btn-delete" style="background: none; border: none; color: var(--danger); cursor: pointer; display: inline-flex; align-items: center; padding: 5px; border-radius: 50%; transition: background 0.2s;" 
                                    onclick="deleteUniformSize('${escapeAttribute(item.category)}', '${escapeAttribute(item.itemType)}', '${escapeAttribute(item.size)}')">
                                    <span class="material-symbols-rounded" style="font-size: 18px;">delete</span>
                                </button>
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
                        <span class="material-symbols-rounded expand-icon" style="transition: transform 0.3s;">expand_more</span>
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

async function deleteUniformSize(category, itemType, size) {
    if (!confirm(`Are you sure you want to delete size ${size} for ${itemType} in ${category}?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/uniforms`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category, itemType, size })
        });

        if (!response.ok) throw new Error('Failed to delete size');

        alert('Size deleted successfully.');
        loadUniforms();
    } catch (error) {
        console.error(error);
        alert('Failed to delete size.');
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

async function loadFeeReceipts() {
    try {
        const response = await fetch(`${API_BASE}/students?academicYear=${encodeURIComponent(getActiveYear())}`);
        currentStudents = await response.json();
        if (!Array.isArray(currentStudents)) currentStudents = [];
        applyReceiptFilters();
    } catch (error) {
        currentStudents = [];
        applyReceiptFilters();
        console.error('Error loading students for receipts', error);
    }
}

function applyReceiptFilters() {
    const searchVal = getValue('filterReceiptSearch').toLowerCase().trim();
    const classVal = getValue('filterReceiptClass') || 'All';
    const startDateVal = getValue('filterReceiptStartDate');
    const endDateVal = getValue('filterReceiptEndDate');
    const modeVal = getValue('filterReceiptPaymentMode') || 'All';

    let allReceipts = [];
    currentStudents.forEach(student => {
        if (student.fees && Array.isArray(student.fees.installments)) {
            student.fees.installments.forEach(inst => {
                allReceipts.push({
                    ...inst,
                    student: student,
                    studentName: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
                    classAdmitted: student.classAdmitted || ''
                });
            });
        }
    });

    // Sort chronologically (newest first)
    allReceipts.sort((a, b) => new Date(b.date) - new Date(a.date));

    let filtered = allReceipts;

    if (searchVal) {
        filtered = filtered.filter(r => 
            r.studentName.toLowerCase().includes(searchVal) ||
            (r.receiptNumber && r.receiptNumber.toLowerCase().includes(searchVal))
        );
    }

    if (classVal !== 'All') {
        filtered = filtered.filter(r => r.classAdmitted === classVal);
    }

    if (startDateVal) {
        const start = new Date(startDateVal);
        start.setHours(0, 0, 0, 0);
        filtered = filtered.filter(r => new Date(r.date) >= start);
    }

    if (endDateVal) {
        const end = new Date(endDateVal);
        end.setHours(23, 59, 59, 999);
        filtered = filtered.filter(r => new Date(r.date) <= end);
    }

    if (modeVal !== 'All') {
        filtered = filtered.filter(r => (r.paymentMode || 'Cash') === modeVal);
    }

    const tbody = document.querySelector('#receiptsTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    filtered.forEach(r => {
        const tr = document.createElement('tr');
        tr.addEventListener('click', () => openReceiptDetailsModal(r));
        const mode = r.paymentMode || 'Cash';

        tr.innerHTML = `
            <td><strong>${escapeHtml(r.receiptNumber || '-')}</strong></td>
            <td><strong>${escapeHtml(r.studentName)}</strong></td>
            <td>${escapeHtml(r.classAdmitted)}</td>
            <td>${formatDate(safeDate(r.date))}</td>
            <td><span class="amount-positive">${formatCurrency(r.amountPaid)}</span></td>
            <td>${escapeHtml(r.payerName)}</td>
            <td>${escapeHtml(r.receiverName)}</td>
            <td><span class="badge ${mode === 'Online' ? 'bg-primary' : 'bg-secondary'}">${escapeHtml(mode)}</span></td>
        `;
        tbody.appendChild(tr);
    });

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-row">No receipts match the selected filters.</td></tr>';
    }

    const countBadge = document.getElementById('receiptsCountBadge');
    if (countBadge) {
        countBadge.textContent = `${filtered.length} Receipts`;
    }
}

function resetReceiptFilters() {
    ['filterReceiptSearch', 'filterReceiptStartDate', 'filterReceiptEndDate'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const classSelect = document.getElementById('filterReceiptClass');
    if (classSelect) classSelect.value = 'All';
    const modeSelect = document.getElementById('filterReceiptPaymentMode');
    if (modeSelect) modeSelect.value = 'All';

    applyReceiptFilters();
}

function refreshActiveTab() {
    const activeTab = document.querySelector('.nav-btn.active')?.dataset.tab || 'dashboard';
    if (activeTab === 'fee-receipts') {
        loadFeeReceipts();
    } else if (activeTab === 'dashboard') {
        loadStudents();
    } else if (activeTab === 'fee-settings') {
        loadFeeSettings();
    } else if (activeTab === 'enquiries') {
        fetchEnquiries();
    } else if (activeTab === 'uniform' || activeTab === 'add-student') {
        loadUniforms();
    }
}

function openReceiptDetailsModal(receipt) {
    document.getElementById('recModalNo').textContent = receipt.receiptNumber || '-';
    document.getElementById('recModalDate').textContent = formatDate(safeDate(receipt.date));
    document.getElementById('recModalStudent').textContent = receipt.studentName || '';
    document.getElementById('recModalClass').textContent = receipt.classAdmitted || '';
    document.getElementById('recModalYear').textContent = receipt.student?.academicYear || getActiveYear();
    document.getElementById('recModalPayer').textContent = receipt.payerName || '-';
    document.getElementById('recModalReceiver').textContent = receipt.receiverName || '-';
    
    const mode = receipt.paymentMode || 'Cash';
    const modeEl = document.getElementById('recModalMode');
    if (modeEl) {
        modeEl.textContent = mode;
        modeEl.className = `badge ${mode === 'Online' ? 'bg-primary' : 'bg-secondary'}`;
    }
    
    document.getElementById('recModalAmount').textContent = formatCurrency(receipt.amountPaid);
    
    document.getElementById('receiptDetailsModal')?.classList.add('show');
}

function printReceipt() {
    const recNo = document.getElementById('recModalNo').textContent;
    const studentName = document.getElementById('recModalStudent').textContent;
    const originalTitle = document.title;

    // Temporarily set document title for PDF name
    document.title = `Fee receipt - ${recNo} - ${studentName}`;

    // Print the parent page directly (supported everywhere including mobile)
    window.print();

    // Restore original title
    setTimeout(() => {
        document.title = originalTitle;
    }, 1000);
}

// --- Activities Logic ---

function generateWinnerInputs() {
    const count = parseInt(document.getElementById('activityWinnersCount').value) || 1;
    const container = document.getElementById('winnersContainer');
    
    let html = '';
    for (let i = 1; i <= count; i++) {
        html += `
            <div class="input-group" style="margin-bottom: 15px; border-left: 3px solid var(--purple); padding-left: 10px;">
                <label>Winner ${i}</label>
                <div style="display: flex; gap: 10px;">
                    <select id="winnerStudent_${i}" class="winner-student-select" required style="flex: 2;">
                        <!-- populated via updateWinnerOptions -->
                    </select>
                    <input type="text" id="winnerPlace_${i}" placeholder="Place (e.g., 1st, 2nd, Gold)" required style="flex: 1;">
                </div>
            </div>
        `;
    }
    container.innerHTML = html;
    updateWinnerOptions();
}

function updateWinnerOptions() {
    const classFilter = document.getElementById('activityClassFilter')?.value || '';
    const nameFilter = document.getElementById('activityNameSearch')?.value.toLowerCase() || '';

    // Filter students
    let filteredStudents = currentStudents;
    if (classFilter) {
        filteredStudents = filteredStudents.filter(s => s.classAdmitted === classFilter);
    }
    if (nameFilter) {
        filteredStudents = filteredStudents.filter(s => 
            s.firstName.toLowerCase().includes(nameFilter) || 
            s.lastName.toLowerCase().includes(nameFilter)
        );
    }

    // Sort alphabetically
    filteredStudents.sort((a, b) => a.firstName.localeCompare(b.firstName));

    let optionsHtml = '<option value="" disabled selected>Select Student</option>';
    filteredStudents.forEach(s => {
        optionsHtml += `<option value="${s._id}">${escapeHtml(s.firstName)} ${escapeHtml(s.lastName)} (${s.classAdmitted})</option>`;
    });

    // Update all winner selects while preserving their current value if possible
    const selects = document.querySelectorAll('.winner-student-select');
    selects.forEach(select => {
        const currentValue = select.value;
        select.innerHTML = optionsHtml;
        // Restore value if it exists in the new options
        if (currentValue && Array.from(select.options).some(opt => opt.value === currentValue)) {
            select.value = currentValue;
        }
    });
}

async function handleAddActivity(event) {
    event.preventDefault();
    
    const activityName = document.getElementById('activityName').value;
    const activityDate = document.getElementById('activityDate').value;
    const count = parseInt(document.getElementById('activityWinnersCount').value) || 1;
    
    const winners = [];
    for (let i = 1; i <= count; i++) {
        const selectEl = document.getElementById(`winnerStudent_${i}`);
        const studentId = selectEl.value;
        const studentName = selectEl.options[selectEl.selectedIndex].text.split(' (')[0];
        
        // Find photo
        const student = currentStudents.find(s => s._id === studentId);
        const studentPhoto = student ? student.photo : '';
        
        const place = document.getElementById(`winnerPlace_${i}`).value;
        
        winners.push({
            studentId,
            studentName,
            studentPhoto,
            place
        });
    }

    try {
        const response = await fetch(`${API_BASE}/activities`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                activityName,
                date: activityDate,
                numberOfWinners: count,
                winners
            })
        });

        if (response.ok) {
            alert('Activity saved successfully!');
            document.getElementById('addActivityForm').reset();
            generateWinnerInputs();
            loadActivities();
        } else {
            const err = await response.json();
            alert('Error: ' + err.error);
        }
    } catch (error) {
        console.error('Error saving activity:', error);
        alert('Failed to save activity.');
    }
}

async function loadActivities() {
    try {
        const response = await fetch(`${API_BASE}/activities`);
        let activities = await response.json();
        
        const dateFrom = document.getElementById('activityDateFrom')?.value;
        const dateTo = document.getElementById('activityDateTo')?.value;
        
        if (dateFrom || dateTo) {
            activities = activities.filter(activity => {
                if (!activity.date) return false;
                const actDate = new Date(activity.date).toISOString().split('T')[0];
                let matches = true;
                if (dateFrom && actDate < dateFrom) matches = false;
                if (dateTo && actDate > dateTo) matches = false;
                return matches;
            });
        }
        
        const tbody = document.querySelector('#activitiesTable tbody');
        tbody.innerHTML = '';
        
        if (activities.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No activities found in this date range.</td></tr>';
            return;
        }

        activities.forEach(activity => {
            const parsedDate = safeDate(activity.date);
            const dateStr = parsedDate ? formatDate(parsedDate) : 'N/A';
            const websiteUrl = window.location.origin;
            
            const winnersText = activity.winners.map(w => {
                let phone = '';
                const student = currentStudents.find(s => s._id === w.studentId);
                if (student) {
                    phone = student.motherDetails?.phone || student.fatherDetails?.phone || '';
                }
                
                let waHtml = '';
                if (phone && activity.showOnWebsite) {
                    phone = phone.replace(/[^0-9]/g, '');
                    if (phone.length === 10) phone = '91' + phone;
                    const specificUrl = `${websiteUrl}/index.html#activity-${activity._id}`;
                    const msg = encodeURIComponent(`Hello! We are thrilled to share that ${w.studentName} has won ${w.place} place in the "${activity.activityName}" activity! Check out their photo on our website: ${specificUrl}`);
                    waHtml = `<a href="https://wa.me/${phone}?text=${msg}" target="_blank" title="Share on WhatsApp" style="margin-left: 8px; color: #25D366; text-decoration: none;"><span class="material-symbols-rounded" style="font-size: 1.2rem; vertical-align: middle;">chat</span></a>`;
                }
                
                return `<div style="margin-bottom: 4px;">${escapeHtml(w.studentName)} (${escapeHtml(w.place)})${waHtml}</div>`;
            }).join('');
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${dateStr}</td>
                <td><strong>${escapeHtml(activity.activityName)}</strong></td>
                <td>${winnersText}</td>
                <td>
                    <label class="switch" style="position: relative; display: inline-block; width: 40px; height: 20px;">
                        <input type="checkbox" ${activity.showOnWebsite ? 'checked' : ''} onchange="toggleActivityVisibility('${activity._id}')" style="opacity: 0; width: 0; height: 0;">
                        <span class="slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: ${activity.showOnWebsite ? 'var(--purple)' : '#ccc'}; transition: .4s; border-radius: 20px;">
                            <span style="position: absolute; content: ''; height: 16px; width: 16px; left: ${activity.showOnWebsite ? '22px' : '2px'}; bottom: 2px; background-color: white; transition: .4s; border-radius: 50%;"></span>
                        </span>
                    </label>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline" style="color: var(--danger); border-color: var(--danger);" onclick="deleteActivity('${activity._id}')">
                        <span class="material-symbols-rounded">delete</span>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error loading activities:', error);
    }
}

async function toggleActivityVisibility(id) {
    try {
        const response = await fetch(`${API_BASE}/activities/${id}/toggle`, { method: 'PATCH' });
        if (response.ok) {
            loadActivities();
        } else {
            alert('Failed to toggle visibility.');
        }
    } catch (error) {
        console.error('Error toggling activity visibility:', error);
    }
}

async function deleteActivity(id) {
    if (!confirm('Are you sure you want to delete this activity?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/activities/${id}`, { method: 'DELETE' });
        if (response.ok) {
            loadActivities();
        } else {
            alert('Failed to delete activity.');
        }
    } catch (error) {
        console.error('Error deleting activity:', error);
    }
}

// --- Celebrations Management ---

let celebrationPhotosBase64 = [];

document.getElementById('celebPhotos')?.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    const previewContainer = document.getElementById('celebPhotoPreview');
    previewContainer.innerHTML = '';
    celebrationPhotosBase64 = [];
    
    if (files.length > 20) {
        alert('You can only select up to 20 photos at a time.');
        e.target.value = '';
        return;
    }

    for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        try {
            const base64 = await resizeImageToMedium(file);
            celebrationPhotosBase64.push(base64);
            
            const img = document.createElement('img');
            img.src = base64;
            img.style.width = '80px';
            img.style.height = '80px';
            img.style.objectFit = 'cover';
            img.style.borderRadius = '8px';
            previewContainer.appendChild(img);
        } catch (err) {
            console.error('Error resizing image:', err);
        }
    }
});

function resizeImageToMedium(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const maxDim = 800; // max dimension

                if (width > maxDim || height > maxDim) {
                    if (width > height) {
                        height = Math.round((height *= maxDim / width));
                        width = maxDim;
                    } else {
                        width = Math.round((width *= maxDim / height));
                        height = maxDim;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function handleAddCelebration(e) {
    e.preventDefault();
    
    if (celebrationPhotosBase64.length === 0) {
        alert('Please add at least one photo.');
        return;
    }
    
    const payload = {
        name: document.getElementById('celebName').value,
        about: document.getElementById('celebAbout').value,
        date: document.getElementById('celebDate').value,
        photos: celebrationPhotosBase64
    };

    try {
        const res = await fetch(`${API_BASE}/celebrations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert('Celebration added successfully!');
            e.target.reset();
            document.getElementById('celebPhotoPreview').innerHTML = '';
            celebrationPhotosBase64 = [];
            loadCelebrations();
        } else {
            const data = await res.json();
            alert(data.error || 'Failed to add celebration');
        }
    } catch (err) {
        console.error(err);
        alert('An error occurred.');
    }
}

async function loadCelebrations() {
    try {
        const res = await fetch(`${API_BASE}/celebrations`);
        const celebrations = await res.json();
        
        const tbody = document.querySelector('#celebrationsTable tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        celebrations.forEach(celeb => {
            const dateStr = new Date(celeb.date).toLocaleDateString();
            const photoCount = celeb.photos ? celeb.photos.length : 0;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${dateStr}</td>
                <td>${celeb.name}</td>
                <td>${photoCount} photo(s)</td>
                <td>
                    <button class="btn btn-outline" style="padding: 5px 10px; margin-right: 5px;" onclick="openEditCelebrationModal('${celeb._id}')">Edit</button>
                    <button class="btn btn-danger" style="padding: 5px 10px;" onclick="deleteCelebration('${celeb._id}')">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error(err);
    }
}

async function deleteCelebration(id) {
    if (!confirm('Are you sure you want to delete this celebration?')) return;
    
    try {
        const res = await fetch(`${API_BASE}/celebrations/${id}`, { method: 'DELETE' });
        if (res.ok) {
            loadCelebrations();
        } else {
            alert('Failed to delete celebration');
        }
    } catch (err) {
        console.error(err);
    }
}

// --- Edit Celebration Logic ---
let editCelebrationPhotosBase64 = [];
let allCelebrationsData = []; // To cache the data when we load it

// Override loadCelebrations to also cache the data
const originalLoadCelebrations = loadCelebrations;
loadCelebrations = async function() {
    try {
        const res = await fetch(`${API_BASE}/celebrations`);
        allCelebrationsData = await res.json();
        
        const tbody = document.querySelector('#celebrationsTable tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        // Sort to ensure the most recent is first
        allCelebrationsData.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        allCelebrationsData.forEach((celeb, index) => {
            const dateStr = new Date(celeb.date).toLocaleDateString();
            const photoCount = celeb.photos ? celeb.photos.length : 0;
            const isMostRecent = index === 0;
            
            let whatsappBtn = '';
            if (isMostRecent) {
                const specificUrl = `${window.location.origin}/index.html#celebrations`;
                const msgText = `Hello Parents! We have a new update! Please check out our recent celebrations directly on our website here: ${specificUrl}`;
                
                whatsappBtn = `<button class="btn" style="padding: 5px 10px; margin-right: 5px; background: #607d8b; color: white; border: none; font-weight: bold; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;" onclick="copyCelebrationShareText('${encodeURIComponent(msgText)}')">
                    <span class="material-symbols-rounded" style="font-size: 1.1rem; vertical-align: middle;">content_copy</span>
                    Copy Share Text
                </button>`;
            }
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${dateStr}</td>
                <td>${celeb.name}</td>
                <td>${photoCount} photo(s)</td>
                <td>
                    ${whatsappBtn}
                    <button class="btn btn-outline" style="padding: 5px 10px; margin-right: 5px;" onclick="openEditCelebrationModal('${celeb._id}')">Edit</button>
                    <button class="btn btn-danger" style="padding: 5px 10px;" onclick="deleteCelebration('${celeb._id}')">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error(err);
    }
};

window.copyCelebrationShareText = function(encodedMsg) {
    const text = decodeURIComponent(encodedMsg);
    navigator.clipboard.writeText(text).then(() => {
        alert('Share text copied to clipboard! You can now paste it into WhatsApp.');
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        alert('Failed to copy text. Please try selecting and copying manually.');
    });
};

function openEditCelebrationModal(id) {
    const celeb = allCelebrationsData.find(c => c._id === id);
    if (!celeb) return;
    
    document.getElementById('editCelebId').value = celeb._id;
    document.getElementById('editCelebName').value = celeb.name;
    document.getElementById('editCelebAbout').value = celeb.about;
    document.getElementById('editCelebDate').value = celeb.date ? new Date(celeb.date).toISOString().split('T')[0] : '';
    
    editCelebrationPhotosBase64 = [...(celeb.photos || [])];
    document.getElementById('editCelebNewPhotos').value = '';
    document.getElementById('editCelebNewPhotosPreview').innerHTML = '';
    
    renderEditCelebrationPhotos();
    
    document.getElementById('editCelebrationModal').classList.add('show');
}

function renderEditCelebrationPhotos() {
    const container = document.getElementById('editCelebExistingPhotos');
    container.innerHTML = '';
    
    editCelebrationPhotosBase64.forEach((photo, index) => {
        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        wrapper.style.display = 'inline-block';
        
        const img = document.createElement('img');
        img.src = photo;
        img.style.width = '80px';
        img.style.height = '80px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '8px';
        
        const deleteBtn = document.createElement('span');
        deleteBtn.innerHTML = '&times;';
        deleteBtn.style.position = 'absolute';
        deleteBtn.style.top = '-5px';
        deleteBtn.style.right = '-5px';
        deleteBtn.style.background = 'red';
        deleteBtn.style.color = 'white';
        deleteBtn.style.borderRadius = '50%';
        deleteBtn.style.width = '20px';
        deleteBtn.style.height = '20px';
        deleteBtn.style.display = 'flex';
        deleteBtn.style.alignItems = 'center';
        deleteBtn.style.justifyContent = 'center';
        deleteBtn.style.cursor = 'pointer';
        deleteBtn.style.fontSize = '14px';
        deleteBtn.style.fontWeight = 'bold';
        
        deleteBtn.onclick = () => {
            editCelebrationPhotosBase64.splice(index, 1);
            renderEditCelebrationPhotos();
        };
        
        wrapper.appendChild(img);
        wrapper.appendChild(deleteBtn);
        container.appendChild(wrapper);
    });
}

document.getElementById('editCelebNewPhotos')?.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    
    if (editCelebrationPhotosBase64.length + files.length > 20) {
        alert(`You can only have up to 20 photos total. You currently have ${editCelebrationPhotosBase64.length}.`);
        e.target.value = '';
        return;
    }

    const previewContainer = document.getElementById('editCelebNewPhotosPreview');
    previewContainer.innerHTML = '<i>Processing new images...</i>';
    
    for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        try {
            const base64 = await resizeImageToMedium(file);
            editCelebrationPhotosBase64.push(base64);
        } catch (err) {
            console.error('Error resizing image:', err);
        }
    }
    
    previewContainer.innerHTML = '';
    e.target.value = ''; // Reset file input so they don't get appended twice if they don't submit yet
    renderEditCelebrationPhotos(); // Just render them alongside existing ones
});

async function handleEditCelebration(e) {
    e.preventDefault();
    
    if (editCelebrationPhotosBase64.length === 0) {
        alert('Please keep at least one photo.');
        return;
    }
    
    const id = document.getElementById('editCelebId').value;
    const payload = {
        name: document.getElementById('editCelebName').value,
        about: document.getElementById('editCelebAbout').value,
        date: document.getElementById('editCelebDate').value,
        photos: editCelebrationPhotosBase64
    };

    try {
        const res = await fetch(`${API_BASE}/celebrations/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert('Celebration updated successfully!');
            closeModal('editCelebrationModal');
            loadCelebrations();
        } else {
            const data = await res.json();
            alert(data.error || 'Failed to update celebration');
        }
    } catch (err) {
        console.error(err);
        alert('An error occurred while updating.');
    }
}
