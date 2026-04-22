// Navigation Logic
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

    if (tabId === 'dashboard') loadStudents();
    if (tabId === 'fee-settings') loadFeeSettings();
    if (tabId === 'enquiries') fetchEnquiries();
}

document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const tabId = e.currentTarget.getAttribute('data-tab');
        switchTab(tabId);
    });
});

// Age Calculation
function calculateAge() {
    const dobInput = document.getElementById('sDob').value;
    if (!dobInput) return;

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

    document.getElementById('sAge').value = `${years} Years, ${months} Months`;
}

// Address Copy
function copyAddress() {
    document.getElementById('tempAddr').value = document.getElementById('permAddr').value;
}

// API Calls
const API_BASE = 'http://localhost:3000/api';

function getActiveYear() {
    return document.getElementById('globalAcademicYear').value;
}

function onAcademicYearChange() {
    loadFeeSettings();
    loadStudents();
}

async function loadFeeSettings() {
    try {
        const year = getActiveYear();
        const res = await fetch(`${API_BASE}/fees?academicYear=${year}`);
        const fees = await res.json();
        
        // Reset fields
        document.getElementById('feePlaygroup').value = '';
        document.getElementById('feeNursery').value = '';
        document.getElementById('feeLKG').value = '';
        document.getElementById('feeUKG').value = '';

        fees.forEach(fee => {
            if (fee.classLevel === 'Playgroup') document.getElementById('feePlaygroup').value = fee.baseFee;
            if (fee.classLevel === 'Nursery') document.getElementById('feeNursery').value = fee.baseFee;
            if (fee.classLevel === 'LKG') document.getElementById('feeLKG').value = fee.baseFee;
            if (fee.classLevel === 'UKG') document.getElementById('feeUKG').value = fee.baseFee;
        });
    } catch (err) {
        console.error('Error loading fees', err);
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
        for (let cls of classes) {
            const val = document.getElementById(cls.id).value;
            if (val) {
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
        }
        alert('Fee Settings Saved Successfully!');
    } catch (err) {
        alert('Error saving fee settings');
        console.error(err);
    }
}

// Add Student Form Submit
document.addEventListener('DOMContentLoaded', () => {
    loadStudents();
    loadFeeSettings();
    fetchEnquiries();
});

document.getElementById('addStudentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    // Construct payload
    const isCustom = document.getElementById('sIsCustom').checked;
    
    const payload = {
        academicYear: getActiveYear(),
        firstName: document.getElementById('sfName').value,
        lastName: document.getElementById('slName').value,
        dob: document.getElementById('sDob').value,
        classAdmitted: document.getElementById('sClass').value,
        concession: Number(document.getElementById('sConcession').value) || 0,
        admissionType: isCustom ? 'Custom' : 'Normal',
        customStartDate: isCustom ? document.getElementById('sCustomStart').value : null,
        customEndDate: isCustom ? document.getElementById('sCustomEnd').value : null,
        customBaseFee: isCustom ? Number(document.getElementById('sCustomFee').value) : null,
        motherDetails: {
            name: document.getElementById('mName').value,
            phone: document.getElementById('mPhone').value,
            occupation: document.getElementById('mOcc').value,
            education: document.getElementById('mEdu').value
        },
        fatherDetails: {
            name: document.getElementById('fName').value,
            phone: document.getElementById('fPhone').value,
            occupation: document.getElementById('fOcc').value,
            education: document.getElementById('fEdu').value
        },
        permanentAddress: document.getElementById('permAddr').value,
        tempAddress: document.getElementById('tempAddr').value
    };

    try {
        const res = await fetch(`${API_BASE}/students`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (res.ok) {
            alert('Student Admitted Successfully!');
            document.getElementById('addStudentForm').reset();
            switchTab('dashboard');
        } else {
            const error = await res.json();
            alert('Error: ' + error.error);
        }
    } catch (err) {
        console.error('Error adding student', err);
        alert('Submission failed');
    }
});

// State for loaded students
let currentStudents = [];

// Load Students Data Table
async function loadStudents() {
    try {
        const year = getActiveYear();
        const res = await fetch(`${API_BASE}/students?academicYear=${year}`);
        currentStudents = await res.json();
        applyFilters();
    } catch (err) {
        console.error('Error loading students', err);
    }
}

function applyFilters() {
    const classFilter = document.getElementById('filterClass').value;
    const pendingFilter = document.getElementById('filterPending').checked;
    const customFilter = document.getElementById('filterCustom').checked;
    const searchFilter = document.getElementById('searchName').value.toLowerCase().trim();

    let filtered = currentStudents;

    if (searchFilter) {
        filtered = filtered.filter(s => {
            const fullName = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase();
            return fullName.includes(searchFilter);
        });
    }

    if (classFilter !== 'All') {
        filtered = filtered.filter(s => s.classAdmitted === classFilter);
    }

    if (customFilter) {
        filtered = filtered.filter(s => s.admissionType === 'Custom');
    }

    const tbody = document.querySelector('#studentsTable tbody');
    tbody.innerHTML = '';

    filtered.forEach(student => {
        const baseFee = student.fees?.baseFeeAtAdmission || 0;
        const concession = student.fees?.concession || 0;
        const totalPaid = student.fees?.installments?.reduce((sum, inst) => sum + inst.amountPaid, 0) || 0;
        const netFee = baseFee - concession;
        const balance = netFee - totalPaid;

        if (pendingFilter && balance <= 0) {
            return; // skip if not pending
        }

        const dob = new Date(student.dob);
        const today = new Date();
        let ageYears = today.getFullYear() - dob.getFullYear();
        let ageMonths = today.getMonth() - dob.getMonth();
        if (ageMonths < 0) {
            ageYears--;
            ageMonths += 12;
        }

        const tr = document.createElement('tr');
        tr.onclick = (e) => {
            // Prevent opening profile if clicking the Add Fee button
            if (e.target.tagName === 'BUTTON' || e.target.parentElement.tagName === 'BUTTON') return;
            openProfileModal(student);
        };
        
        tr.innerHTML = `
            <td><strong>${student.firstName} ${student.lastName}</strong></td>
            <td>${student.classAdmitted}</td>
            <td>${dob.toLocaleDateString()} (${ageYears}y ${ageMonths}m)</td>
            <td>
                ₹${baseFee} 
                ${concession > 0 ? `<br><small class="text-muted">-₹${concession} conc.</small>` : ''}
            </td>
            <td style="color: green; font-weight: 600;">₹${totalPaid}</td>
            <td style="color: ${balance > 0 ? 'red' : 'green'}; font-weight: 600;">₹${balance}</td>
            <td>
                <button class="btn btn-sm btn-outline" onclick="openFeeModal('${student._id}', '${student.firstName} ${student.lastName}', ${balance})">
                    Add Fee
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function toggleCustomAdmission() {
    const isCustom = document.getElementById('sIsCustom').checked;
    const fieldsDiv = document.getElementById('customAdmissionFields');
    if (isCustom) {
        fieldsDiv.style.display = 'grid'; // because it's form-grid-3
        document.getElementById('sCustomStart').required = true;
        document.getElementById('sCustomEnd').required = true;
        document.getElementById('sCustomFee').required = true;
    } else {
        fieldsDiv.style.display = 'none';
        document.getElementById('sCustomStart').required = false;
        document.getElementById('sCustomEnd').required = false;
        document.getElementById('sCustomFee').required = false;
    }
}

// Fee Modal Logic
const feeModal = document.getElementById('feeModal');

function openFeeModal(studentId, studentName, balance) {
    document.getElementById('fcStudentId').value = studentId;
    document.getElementById('feeModalStudentInfo').innerText = `Recording payment for ${studentName}. Remaining Balance: ₹${balance}`;
    document.getElementById('fcAmount').value = balance > 0 ? balance : 0;
    
    // set today's date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('fcDate').value = today;

    feeModal.classList.add('show');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
    if (modalId === 'feeModal') document.getElementById('feeCollectionForm').reset();
    if (modalId === 'profileModal') toggleEditProfile(false); // turn off edit mode
}

document.getElementById('feeCollectionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const studentId = document.getElementById('fcStudentId').value;
    const payload = {
        amountPaid: Number(document.getElementById('fcAmount').value),
        date: document.getElementById('fcDate').value,
        payerName: document.getElementById('fcPayer').value,
        receiverName: document.getElementById('fcReceiver').value,
        paymentMode: document.getElementById('fcPaymentMode').value || 'Cash'
    };

    try {
        const res = await fetch(`${API_BASE}/students/${studentId}/fees`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert('Payment Recorded Successfully!');
            closeModal('feeModal');
            loadStudents(); // Refresh table
        } else {
            const err = await res.json();
            alert('Error: ' + err.error);
        }
    } catch (err) {
        console.error(err);
        alert('Failed to record payment');
    }
});

// Profile Modal Logic
function openProfileModal(student) {
    document.getElementById('profId').value = student._id;
    document.getElementById('profName').innerText = `${student.firstName} ${student.lastName} Profile`;
    
    // Admission Badge & Setup
    const aType = student.admissionType || 'Normal';
    const badge = document.getElementById('profAdmissionBadge');
    badge.innerText = aType + ' Admission';
    badge.style.background = aType === 'Custom' ? 'var(--secondary)' : 'var(--purple)';

    document.getElementById('pAdmissionType').value = aType;
    if (aType === 'Custom') {
        document.getElementById('pCustomStart').value = student.customStartDate ? new Date(student.customStartDate).toISOString().split('T')[0] : '';
        document.getElementById('pCustomEnd').value = student.customEndDate ? new Date(student.customEndDate).toISOString().split('T')[0] : '';
        document.getElementById('pCustomFee').value = student.fees?.baseFeeAtAdmission || 0;
    }
    document.getElementById('pConcession').value = student.fees?.concession || 0;
    toggleProfileCustomFields();

    // Fill text inputs
    document.getElementById('pFirstName').value = student.firstName;
    document.getElementById('pLastName').value = student.lastName;
    document.getElementById('pClass').value = student.classAdmitted;
    document.getElementById('pDob').value = new Date(student.dob).toISOString().split('T')[0];
    
    document.getElementById('pMName').value = student.motherDetails?.name || '';
    document.getElementById('pMPhone').value = student.motherDetails?.phone || '';
    document.getElementById('pMOcc').value = student.motherDetails?.occupation || '';
    document.getElementById('pMEdu').value = student.motherDetails?.education || '';
    
    document.getElementById('pFName').value = student.fatherDetails?.name || '';
    document.getElementById('pFPhone').value = student.fatherDetails?.phone || '';
    document.getElementById('pFOcc').value = student.fatherDetails?.occupation || '';
    document.getElementById('pFEdu').value = student.fatherDetails?.education || '';
    
    document.getElementById('pPAddr').value = student.permanentAddress || '';
    document.getElementById('pTAddr').value = student.tempAddress || '';

    // Load Installments History
    const tbody = document.querySelector('#profInstallmentsTable tbody');
    tbody.innerHTML = '';
    const installments = student.fees?.installments || [];
    
    if (installments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No payments recorded.</td></tr>';
    } else {
        installments.forEach(inst => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(inst.date).toLocaleDateString()}</td>
                <td style="color: green; font-weight: 600;">₹${inst.amountPaid}</td>
                <td>${inst.payerName}</td>
                <td>${inst.receiverName}</td>
                <td><span class="badge ${inst.paymentMode === 'Online' ? 'bg-primary' : 'bg-secondary'}" style="padding: 4px 8px; border-radius: 4px; color: white; font-size: 11px;">${inst.paymentMode || 'Cash'}</span></td>
            `;
            tbody.appendChild(row);
        });
    }

    toggleEditProfile(true); // Always lock it when opening
    document.getElementById('profileModal').classList.add('show');
}

function toggleProfileCustomFields() {
    const type = document.getElementById('pAdmissionType').value;
    const isCustom = type === 'Custom';
    const customGroups = document.querySelectorAll('.pCustomGroup');
    customGroups.forEach(g => {
        g.style.display = isCustom ? 'block' : 'none';
        const input = g.querySelector('input');
        if (input) input.required = isCustom;
    });
}

function toggleEditProfile(forceOff = false) {
    const isCurrentlyEditing = document.getElementById('pFirstName').readOnly === false;
    const shouldEdit = forceOff ? false : !isCurrentlyEditing;
    
    const fields = [
        'pFirstName', 'pLastName', 'pDob', 'pMName', 'pMPhone', 'pMOcc', 'pMEdu', 
        'pFName', 'pFPhone', 'pFOcc', 'pFEdu', 'pPAddr', 'pTAddr', 
        'pCustomStart', 'pCustomEnd', 'pCustomFee', 'pConcession'
    ];
    
    fields.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.readOnly = !shouldEdit;
    });
    
    document.getElementById('pClass').disabled = !shouldEdit;
    document.getElementById('pAdmissionType').disabled = !shouldEdit;
    
    if (shouldEdit) {
        document.getElementById('profSaveContainer').style.display = 'block';
        document.getElementById('btnEditProf').style.display = 'none';
    } else {
        document.getElementById('profSaveContainer').style.display = 'none';
        document.getElementById('btnEditProf').style.display = 'inline-flex';
    }
}

async function saveProfileChanges() {
    const studentId = document.getElementById('profId').value;
    const aType = document.getElementById('pAdmissionType').value;
    const payload = {
        firstName: document.getElementById('pFirstName').value,
        lastName: document.getElementById('pLastName').value,
        dob: document.getElementById('pDob').value,
        classAdmitted: document.getElementById('pClass').value,
        admissionType: aType,
        motherDetails: {
            name: document.getElementById('pMName').value,
            phone: document.getElementById('pMPhone').value,
            occupation: document.getElementById('pMOcc').value,
            education: document.getElementById('pMEdu').value
        },
        fatherDetails: {
            name: document.getElementById('pFName').value,
            phone: document.getElementById('pFPhone').value,
            occupation: document.getElementById('pFOcc').value,
            education: document.getElementById('pFEdu').value
        },
        permanentAddress: document.getElementById('pPAddr').value,
        tempAddress: document.getElementById('pTAddr').value
    };

    if (aType === 'Custom') {
        payload.customStartDate = document.getElementById('pCustomStart').value;
        payload.customEndDate = document.getElementById('pCustomEnd').value;
        payload.baseFeeAtAdmission = Number(document.getElementById('pCustomFee').value);
    } else {
        payload.customStartDate = null;
        payload.customEndDate = null;
    }
    
    payload.updateConcession = Number(document.getElementById('pConcession').value) || 0;

    try {
        const res = await fetch(`${API_BASE}/students/${studentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert('Profile Updated Successfully!');
            closeModal('profileModal');
            loadStudents();
        } else {
            alert('Error updating profile');
        }
    } catch (err) {
        console.error(err);
        alert('Failed to update profile');
    }
}

async function deleteStudent() {
    const studentId = document.getElementById('profId').value;
    const confirmDelete = confirm('Are you sure you want to permanently delete this student? This action cannot be undone.');
    
    if (confirmDelete) {
        try {
            const res = await fetch(`${API_BASE}/students/${studentId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                alert('Student deleted entirely.');
                closeModal('profileModal');
                loadStudents();
            } else {
                alert('Error deleting student.');
            }
        } catch(err) {
            console.error(err);
            alert('Failed to delete student.');
        }
    }
}

// Init
window.onload = () => {
    loadStudents();
};

// --- ENQUIRIES LOGIC ---
let currentEnquiries = [];

async function fetchEnquiries() {
    try {
        const res = await fetch(`${API_BASE}/enquiries`);
        currentEnquiries = await res.json();
        renderEnquiries();
    } catch (err) {
        console.error('Error fetching enquiries:', err);
    }
}

function renderEnquiries() {
    const tbody = document.querySelector('#enquiriesTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!currentEnquiries || currentEnquiries.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 20px;">No enquiries received yet.</td></tr>`;
        return;
    }

    currentEnquiries.forEach(enq => {
        const date = new Date(enq.createdAt);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <strong>${date.toLocaleDateString()}</strong><br>
                <small>${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
            </td>
            <td><strong>${enq.parentName}</strong></td>
            <td>${enq.childAge} yrs</td>
            <td><a href="tel:${enq.phone}">${enq.phone}</a></td>
            <td style="vertical-align: middle;">
                <div style="display: flex; align-items: center; gap: 14px;">
                    <!-- Custom Premium Toggle Switch with Label -->
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                        <div style="width: 44px; height: 24px; background: ${enq.contacted ? 'var(--success, #22c55e)' : 'var(--danger)'}; border-radius: 12px; position: relative; cursor: pointer; transition: background 0.3s;" 
                             onclick="toggleEnquiryContacted('${enq._id}', ${!enq.contacted})"
                             title="${enq.contacted ? 'Mark as Pending' : 'Mark as Contacted'}">
                            <div style="width: 20px; height: 20px; background: white; border-radius: 50%; position: absolute; top: 2px; left: ${enq.contacted ? '22px' : '2px'}; transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>
                        </div>
                        <small style="font-size: 11px; font-weight: 600; color: ${enq.contacted ? 'var(--success, #22c55e)' : 'var(--danger)'};">${enq.contacted ? 'Contacted' : 'Pending'}</small>
                    </div>
                    
                    <!-- Premium Soft Delete Button (Dustbin) -->
                    <div style="width: 32px; height: 32px; border-radius: 8px; background: #fee2e2; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.2s ease, transform 0.1s;" 
                         onmouseover="this.style.background='#fca5a5'" 
                         onmouseout="this.style.background='#fee2e2'"
                         onmousedown="this.style.transform='scale(0.9)'"
                         onmouseup="this.style.transform='scale(1)'"
                         onmouseleave="this.style.transform='scale(1)'"
                         onclick="deleteEnquiry('${enq._id}')" 
                         title="Delete Enquiry">
                        <span class="material-symbols-rounded" style="color: var(--danger); font-size: 18px;">delete</span>
                    </div>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function deleteEnquiry(id) {
    if (!confirm('Are you sure you want to permanently delete this enquiry?')) return;
    
    try {
        const res = await fetch(`${API_BASE}/enquiries/${id}`, { method: 'DELETE' });
        if (res.ok) {
            fetchEnquiries();
        } else {
            const data = await res.json();
            alert(data.error);
        }
    } catch (err) {
        console.error('Error deleting enquiry:', err);
    }
}

async function toggleEnquiryContacted(id, status) {
    try {
        const res = await fetch(`${API_BASE}/enquiries/${id}/toggle-contacted`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contacted: status })
        });
        
        if (res.ok) {
            fetchEnquiries();
        } else {
            console.error('Failed to toggle status');
        }
    } catch (err) {
        console.error('Error toggling enquiry:', err);
    }
}
