<?php
session_start();

if (isset($_SESSION['role'])) {
    header("Location: views/book.php");
    exit;
}
?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login</title>
    <link rel="shortcut icon" href="//img1.wsimg.com/isteam/ip/e0b02d97-2d61-45fc-8661-84ba6f5d4cd1/favicon/597c5ab0-d53e-459e-9889-86405dd520a5.png/:/rs=w:64,h:64,m" type="image/x-icon">
    <link rel="stylesheet" href="assets/css/plugins/bootstrap.min.css">
</head>

<body>
    <nav class="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm sticky-top">
        <div class="container-fluid px-3 px-lg-5">
            <a class="navbar-brand d-flex align-items-center" href="#">
                <img src="//img1.wsimg.com/isteam/ip/e0b02d97-2d61-45fc-8661-84ba6f5d4cd1/favicon/597c5ab0-d53e-459e-9889-86405dd520a5.png/:/rs=w:64,h:64,m" alt="logo" width="40" height="40" class="me-3">
                <div>
                    <h4 class="mb-0 fw-bold text-primary d-block d-lg-none">CITS</h4>
                    <h4 class="mb-0 fw-bold text-primary d-none d-lg-block">Cloudsteps Booking Appointment</h4>

                    <small class="text-muted d-none d-lg-block">Crafting Masterpiece in Digital Transformation</small>
                </div>
            </a>

        </div>
    </nav>
    <div class="container">

        <section class="p-3 p-md-4 p-xl-5">
            <div class="container">
                <div class="card border-light-subtle shadow">
                    <div class="row g-0">
                        <div class="col-12 col-md-6">
                            <img class="img-fluid rounded-start d-flex justify-content-center" loading="lazy" src="assets/images/login-img.svg" alt="login">
                        </div>
                        <div class="col-12 col-md-6">
                            <div class="card-body p-3 p-md-4 p-xl-5">
                                <div class="row">
                                    <div class="col-12">
                                        <div class="mb-5">
                                            <h3>Log in</h3>
                                        </div>
                                    </div>
                                </div>
                                <form id="loginForm">
                                    <div class="row gy-3 gy-md-4 overflow-hidden">
                                        <div class="col-12">
                                            <label for="username" class="form-label">Username <span class="text-danger">*</span></label>
                                            <input type="text" class="form-control" name="username" id="username" placeholder="admin" required>
                                        </div>
                                        <div class="col-12">
                                            <label for="password" class="form-label">Password <span class="text-danger">*</span></label>
                                            <input type="password" class="form-control" name="password" id="password" value="" required>
                                        </div>
                                        <div class="col-12">
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" value="" name="show_password" id="checkBoxPassword" onclick="password.type = this.checked ? 'text' : 'password'">
                                                <label class="form-check-label text-secondary" for="show_password">
                                                    Show Password
                                                </label>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="d-grid">
                                                <button class="btn bsb-btn-xl btn-primary" type="submit">Log in</button>
                                            </div>
                                            <div class="mt-3 text-center">
                                                <span class="badge bg-light text-dark border">
                                                    <strong>Default Login →</strong> admin / admin123
                                                </span>
                                            </div>

                                        </div>
                                    </div>
                                </form>
                                <div class="row">
                                    <div class="col-12">
                                        <hr class="mt-5 mb-4 border-secondary-subtle">
                                        <div class="d-flex gap-2 gap-md-4 flex-column flex-md-row justify-content-md-end">
                                            <a href="" class="link-secondary text-decoration-none">Create New Account</a>
                                            <a href="" class="link-secondary text-decoration-none">Forgot Password</a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </div>

    <script src="assets/js/plugins/jquery.min.js"></script>
    <script src="assets/js/plugins/bootstrap.bundle.min.js"></script>
    <script src="assets/js/plugins/sweetalert2.all.min.js"></script>

    <script>
        $(document).ready(function() {

        });

        $('#loginForm').submit(function(e) {
            e.preventDefault();

            $.ajax({
                url: '../api/handlers/auth/login.php',
                type: 'POST',
                data: $('#loginForm').serialize(),
                dataType: 'json',
                success: function(response) {
                    if (response.status === 'success') {
                        Swal.fire({
                            toast: true,
                            position: 'top-end',
                            icon: 'success',
                            title: 'Login successful! Redirecting...',
                            showConfirmButton: false,
                            timer: 1200
                        }).then(() => {
                            window.location.href = "views/book.php";
                        });
                    } else {
                        Swal.fire('Error!', response.message, 'error');
                    }
                },
                error: function() {
                    Swal.fire('Error', 'Login error.', 'error');
                }
            });
        });
    </script>
</body>

</html>