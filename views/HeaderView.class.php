<?php
class HeaderView {

    public static function show($title = null) {
        $host_base = $_SERVER['HTTP_HOST'].'/'.$_SESSION['base'];
        if (isset($_SESSION['profile']) && $_SESSION['profile']->getTheme() == 'dark') {
            $bootstrap_css = '/css/bootstrap.dark.min.css';
            $logo = '/images/logo_dark.png';
            $disabledLight = '';
            $disabledDark = ' disable';
            $titleLight = 'Enable the light theme';
            $titleDark = 'The dark theme is enabled';
        } else {
            $bootstrap_css = '/css/bootstrap.min.css';
            $logo = '/images/logo.png';
            $disabledLight = ' disable';
            $disabledDark = '';
            $titleLight = 'The light theme is enabled';
            $titleDark = 'Enable the dark theme';
        }

?><!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
    <link rel="stylesheet"
		href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css"
		integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm"
		crossorigin="anonymous">
    <link rel="stylesheet" href="//<?= $host_base . '/css/neustart.css'?>" type="text/css" /><?php
        if (isset($_SESSION['styles'])):
            foreach ($_SESSION['styles'] as $style): ?>
    <link rel="stylesheet" href="//<?= $host_base . '/css/' . $style ?>" type="text/css" /><?php
            endforeach;
            unset($_SESSION['styles']);
        endif; ?>
    <script src="https://code.jquery.com/jquery-3.3.1.js"
    	integrity="sha256-2Kok7MbOyxpgUVvAk/HJ2jigOSYS2auK4Pfzbm7uH60="
    	crossorigin="anonymous"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.9/umd/popper.min.js"
		integrity="sha384-ApNbgh9B+Y1QKtv3Rn7W3mgPxhU9K/ScQsAP7hUibX39j7fakFPskvXusvfa0b4Q"
		crossorigin="anonymous"></script>
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/js/bootstrap.min.js"
		integrity="sha384-JZR6Spejh4U02d8jOt6vLEHfe/JQGiRRSQQxSfFWpi1MquVdAyjUar5+76PVCmYl"
		crossorigin="anonymous"></script><?php
        if (isset($_SESSION['scripts'])):
            foreach ($_SESSION['scripts'] as $script): ?>
    <script src="//<?= $host_base . 'js/' . $script ?>"></script><?php
            endforeach;
            unset($_SESSION['scripts']);
        endif;
        if (isset($_SESSION['libraries'])):
            foreach ($_SESSION['libraries'] as $library): ?>
    <script src="//<?= $host_base . '/lib/' . $library ?>"></script><?php
            endforeach;
            unset($_SESSION['libraries']);
        endif; ?>
    <title>Neustart | <?= $title ?></title>
</head>
<body><?php

        // display flash message to user if present
        if (isset($_SESSION['flash'])): ?>
<div class="container">
    <div class="row justify-content-md-center">
        <div class="col-sm-12 col-lg-6">

            <div class="alert alert-<?=$_SESSION['alertType']?> alert-dismissible fade show" role="alert">
                <?= $_SESSION['flash'] ?>
                <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>

        </div>
    </div>
</div><?php
        endif;

        // display page title if present
        if (!is_null($title)): ?>
<div class="container">
    <div class="row">
        <div class="col-sm-12">
            <h1 id="pagetitle" class="page-header"><?=$title?></h1>
        </div>
    </div>
</div><?php
        endif; ?>

<?php
        if (isset($_SESSION['flash']))
            unset($_SESSION['flash']);
        if (isset($_SESSION['alertType']))
            unset($_SESSION['alertType']);
    }
}
?>