<?php
$pathDir = dirname(__FILE__);
$paths = array("views", "models", "controllers", "resources", "exceptions");
$includePath = get_include_path();
foreach ($paths as $path) {
	$includePath .= PATH_SEPARATOR . $pathDir . DIRECTORY_SEPARATOR . $path;
}
$includePath .= PATH_SEPARATOR . $pathDir . DIRECTORY_SEPARATOR;
set_include_path($includePath);

spl_autoload_register('myClassLoader');

function myClassLoader($className) {
	$paths = explode(PATH_SEPARATOR, get_include_path());
	foreach ($paths as $path) {
		$file = $path . DIRECTORY_SEPARATOR . $className . '.class.php';
		if (file_exists($file)) {
			include_once $file;
			break;
		}
	}
}
?>