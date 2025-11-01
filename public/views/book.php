<?php
session_start();

if (!isset($_SESSION['role'])) {
    header("Location: ../index.php");
    exit;
}

$user = $_SESSION['username'] ?? 'User';
?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Book Appointment</title>
    <link href="../assets/css/plugins/bootstrap.min.css" rel="stylesheet">
</head>

<body class="bg-light">

    <!-- Navbar -->
    <nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm mb-4">
        <div class="container">
            <a class="navbar-brand fw-semibold" href="#">Booking System</a>
            <div class="d-flex align-items-center">
                <span class="me-3 text-muted">Welcome, <?= htmlspecialchars($user) ?></span>
                <a href="../../api/handlers/auth/logout.php" class="btn btn-outline-danger btn-sm">Logout</a>
            </div>
        </div>
    </nav>

    <!-- Booking Form -->
    <div class="container">
        <div class="card shadow-sm">
            <div class="card-header bg-primary text-white text-center">
                <h4 class="mb-0">Book Your Appointment</h4>
                <small>Select your preferred options</small>
            </div>
            <div class="card-body">
                <form id="bookingForm">

                    <!-- Branch -->
                    <div class="mb-3">
                        <label for="branch" class="form-label">Branch Location</label>
                        <select class="form-select" id="branch" required>
                            <option value="" selected disabled>Choose a branch...</option>
                        </select>
                    </div>

                    <!-- Service -->
                    <div class="mb-3">
                        <label for="service" class="form-label">Service</label>
                        <select id="service" class="form-select" required></select>
                    </div>

                    <!-- Staff -->
                    <div class="mb-3">
                        <label for="staff" class="form-label">Staff</label>
                        <select id="staff" class="form-select" required></select>
                    </div>

                    <!-- Room -->
                    <div class="mb-3">
                        <label for="room" class="form-label">Room</label>
                        <select id="room" class="form-select" required></select>
                    </div>

                    <!-- Date -->
                    <div class="mb-3">
                        <label for="date" class="form-label">Date</label>
                        <input type="date" class="form-control" id="date" required>
                    </div>

                    <!-- Time Slots -->
                    <div class="mb-3">
                        <label class="form-label">Select Time</label>
                        <div class="d-flex flex-wrap gap-2" id="timeSlots">
                        </div>
                        <input type="hidden" id="selectedTime" required>
                    </div>

                    <!-- Submit -->
                    <div class="d-grid">
                        <button type="submit" class="btn btn-primary">Confirm Booking</button>
                    </div>

                </form>
            </div>
        </div>
    </div>

    <script src="../assets/js/plugins/jquery.min.js"></script>
    <script src="../assets/js/plugins/bootstrap.bundle.min.js"></script>
    <script src="../assets/js/plugins/sweetalert2.all.min.js"></script>
<script>
    // Select time slot
    const timeButtons = document.querySelectorAll('.time-slot');
    const selectedTime = document.getElementById('selectedTime');

    timeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            timeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedTime.value = btn.getAttribute('data-time');
        });
    });

    $(document).ready(function () {
        // Load branch list
        $.ajax({
            url: "../../api/get_booking_setup_list.php",
            method: "GET",
            dataType: "json",
            success: function (data) {
                let branches = [];
                try {
                    branches = JSON.parse(data.value);
                } catch (e) {
                    console.error("Error parsing branches:", e);
                }

                const branchSelect = $("#branch");
                branchSelect.empty().append('<option value="" disabled selected>Choose a branch...</option>');
                if (Array.isArray(branches) && branches.length > 0) {
                    branches.forEach(b => {
                        branchSelect.append(`<option value="${b.Code}">${b.Code} - ${b.Description} - ${b.Location}</option>`);
                    });
                } else {
                    branchSelect.append('<option disabled>No branches available</option>');
                }
            },
            error: function (xhr) {
                console.error("Error:", xhr.responseText);
                $("#branch").append('<option disabled>Error loading branches</option>');
            }
        });
    });

    let lastSelectedBranch = null;

    $('#branch').on('change', function () {
        const selectedBranch = $(this).val();
        if (selectedBranch && selectedBranch !== lastSelectedBranch) {
            lastSelectedBranch = selectedBranch;
            getBookingSetup(selectedBranch);
        }
    });

    function getBookingSetup(branch) {
        const selects = ["service", "staff", "room"];
        selects.forEach(id => {
            $(`#${id}`).prop("disabled", true).html('<option>Loading...</option>');
        });

        $.ajax({
            url: "../../api/get_booking_setup.php",
            method: "GET",
            data: { branch },
            dataType: "json",
            success: function (response) {
                try {
                    const rawValue = response?.value;
                    if (!rawValue) throw new Error("No setup data found in response.");

                    const setupList = JSON.parse(rawValue);
                    if (!Array.isArray(setupList) || setupList.length === 0)
                        throw new Error("No valid booking setup found.");

                    const mainSetup = setupList[0];
                    const params = mainSetup?.BookingParameter || [];

                    // Helper to fill selects
                    const fillSelect = (id, values, label) => {
                        const select = $(`#${id}`);
                        select.empty();

                        if (Array.isArray(values) && values.length > 0) {
                            select.append(`<option value="" selected disabled>Select ${label}</option>`);
                            values.forEach(v => {
                                select.append(`<option value="${v.BookingParameterValueCode}">${v.BookingParamterDesc}</option>`);
                            });
                            select.prop("disabled", false);
                        } else {
                            select.append(`<option disabled>No ${label.toLowerCase()} available</option>`);
                            select.prop("disabled", true);
                        }
                    };

                    // Default empty arrays
                    let serviceValues = [];
                    let staffValues = [];
                    let roomValues = [];

                    // ✅ Map booking parameter IDs dynamically
                    window.bookingParamMap = {
                        service: null,
                        staff: null,
                        room: null
                    };

                    params.forEach((param, index) => {
                        const code = (param.BookingParameterCode || "").toUpperCase();
                        const values = param.BookingParameterValue || [];
                        const paramID = param.BookingParameterID || (index + 1); // fallback if missing

                        if (/SERVICE/i.test(code)) {
                            serviceValues = values;
                            window.bookingParamMap.service = paramID;
                        } else if (/STAFF/i.test(code)) {
                            staffValues = values;
                            window.bookingParamMap.staff = paramID;
                        } else if (/BEN|ROOM/i.test(code)) {
                            roomValues = values;
                            window.bookingParamMap.room = paramID;
                        }
                    });

                    // Fill dropdowns
                    fillSelect("service", serviceValues, "Service");
                    fillSelect("staff", staffValues, "Staff");
                    fillSelect("room", roomValues, "Room");

                    if (serviceValues.length === 0 && staffValues.length === 0 && roomValues.length === 0) {
                        Swal.fire({
                            icon: "info",
                            title: "No booking options found",
                            text: "This branch doesn’t have any booking parameters configured yet.",
                            timer: 2500,
                            showConfirmButton: false
                        });
                    }

                } catch (err) {
                    console.error("Parsing error:", err);
                    selects.forEach(id => {
                        $(`#${id}`).html('<option disabled>No data available</option>').prop("disabled", true);
                    });
                    Swal.fire("Error", "Failed to process booking setup data.", "error");
                }
            },
            error: function (xhr) {
                console.error("Error:", xhr.responseText);
                selects.forEach(id => {
                    $(`#${id}`).html('<option disabled>Failed to load</option>').prop("disabled", true);
                });
                Swal.fire("Error", "Failed to load booking setup from server.", "error");
            }
        });
    }

    // ============================
    // Dynamically load time slots
    // ============================
    let lastSelectedDate = null;

    $('#date').on('change', function () {
        const selectedBranch = $('#branch').val();
        const selectedDate = $(this).val();

        if (!selectedBranch || !selectedDate) return;

        const serviceVal = $('#service').val();
        const staffVal = $('#staff').val();
        const roomVal = $('#room').val();

        if (!serviceVal || !staffVal || !roomVal) {
            Swal.fire({
                icon: "info",
                title: "Incomplete Selection",
                text: "Please select service, staff, and room before choosing a date.",
                timer: 2000,
                showConfirmButton: false
            });
            return;
        }

        // Build parameter info dynamically
        const selectedParams = [];

        if (window.bookingParamMap.service)
            selectedParams.push({ id: window.bookingParamMap.service, value: serviceVal });
        if (window.bookingParamMap.staff)
            selectedParams.push({ id: window.bookingParamMap.staff, value: staffVal });
        if (window.bookingParamMap.room)
            selectedParams.push({ id: window.bookingParamMap.room, value: roomVal });

        const _bookingParamCount = selectedParams.length;
        const _bookingParamIDs = selectedParams.map(p => p.id).join("|");
        const _bookingParamValueIDs = selectedParams.map(p => p.value).join("|");

        getAvailableTimeSlots(selectedBranch, selectedDate, _bookingParamCount, _bookingParamIDs, _bookingParamValueIDs);
    });

    function getAvailableTimeSlots(branch, date, bookingParamCount, bookingParamIDs, bookingParamValueIDs) {
        const timeSlotsContainer = $("#timeSlots");
        const selectedTimeInput = $("#selectedTime");

        timeSlotsContainer.html('<div class="text-muted">Loading available time slots...</div>');
        selectedTimeInput.val("");

        const postData = {
            _BookingSetupCode: branch,
            _BookingDate: date,
            _BookingParameterCount: bookingParamCount,
            _BookingParameterIDs: bookingParamIDs,
            _BookingParameterValueIDs: bookingParamValueIDs
        };

        $.ajax({
            url: "../../api/get_available_time_slots.php",
            method: "POST",
            data: postData,
            dataType: "json",
            success: function (response) {
                try {
                    const rawValue = response?.value;
                    if (!rawValue) throw new Error("No time slot data returned.");

                    const timeSlots = JSON.parse(rawValue);
                    if (!Array.isArray(timeSlots) || timeSlots.length === 0)
                        throw new Error("No available time slots found.");

                    timeSlotsContainer.empty();

                    timeSlots.forEach(slot => {
                        const timeText = slot?.Time || slot?.StartTime;
                        if (timeText) {
                            const btn = $(`<button type="button" class="btn btn-outline-primary btn-sm time-slot" data-time="${timeText}">${timeText}</button>`);
                            timeSlotsContainer.append(btn);
                        }
                    });

                    if (timeSlotsContainer.children().length === 0) {
                        timeSlotsContainer.html('<div class="text-danger">No available time slots for this date.</div>');
                        return;
                    }

                    $(".time-slot").on("click", function () {
                        $(".time-slot").removeClass("active btn-primary").addClass("btn-outline-primary");
                        $(this).removeClass("btn-outline-primary").addClass("btn-primary active");
                        selectedTimeInput.val($(this).data("time"));
                    });

                } catch (err) {
                    console.error("Error processing time slots:", err);
                    timeSlotsContainer.html('<div class="text-danger">Failed to load time slots.</div>');
                    Swal.fire("Error", err.message || "Invalid time slot data returned.", "error");
                }
            },
            error: function (xhr) {
                console.error("Error:", xhr.responseText);
                timeSlotsContainer.html('<div class="text-danger">Unable to fetch time slots from server.</div>');
                Swal.fire("Error", "Failed to load available time slots.", "error");
            }
        });
    }

    // Optional: auto-refresh time slots when dropdowns change
    $('#service, #staff, #room').on('change', function () {
        const selectedBranch = $('#branch').val();
        const selectedDate = $('#date').val();
        if (selectedBranch && selectedDate) {
            $('#date').trigger('change');
        }
    });
</script>


</body>

</html>