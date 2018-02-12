<?php
class FooterView {

    public static function show() {
        ?>
</div>  <!-- closes .container for header and body -->

<div class="container-fluid">
    <div class="row">
        <div class="col-sm-12">
            <hr />
        </div>
    </div>
    <footer class="row">
        <!-- <h2 class="hidden">Site Map</h2> -->
        <div class="col-xs-4 col-xs-offset-0 col-sm-3 col-sm-offset-2">
            <h3>Main Site</h3>
            <ul class="list-unstyled">
                <li><a href="home">Home</a></li>
                <li><a href="members">Member List</a></li><?php
            if (!isset($_SESSION) || !isset($_SESSION['profile'])): ?>
                <li><a href="signup_show">Sign Up</a></li><?php
            endif; ?>
            </ul>
        </div>

        <div class="col-xs-4 col-sm-3">
            <h3>Members</h3>
            <ul class="list-unstyled"><?php
            if (isset($_SESSION) && isset($_SESSION['profile'])): ?>
        		<li><a href="measurements_show_all">Measurements</a></li>
        		<li><a href="profile_show">Profile</a></li>
                <li><a href="login_logout">Logout</a></li><?php
            else: ?>
                <li><a href="login_show">Login</a></li><?php
            endif; ?> 
            </ul>
        </div>

        <div class="col-xs-4 col-sm-3">
            <h3>Help</h3>
            <ul class="list-unstyled">
                <li><a href="faq">FAQ</a></li>
            </ul>
        </div>

        <div class="col-sm-1">

        </div>
    </footer>

</div>

</body>
</html>
<?php
    }
}
?>