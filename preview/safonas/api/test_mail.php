<?php
// Simple mail tester
error_reporting(E_ALL);
ini_set('display_errors', 1);

$to = 'hello@safonas.com'; // Replace with your email if needed for testing
$subject = 'Test PHP Mail Functionality';
$message = 'This is a test email from the Safonas server to verify PHP mail() works.';
$headers = 'From: noreply@safonas.com' . "\r\n" .
    'Reply-To: noreply@safonas.com' . "\r\n" .
    'X-Mailer: PHP/' . phpversion();

echo "Attempting to send email to $to...<br>";

if (mail($to, $subject, $message, $headers)) {
    echo "Email sent successfully!";
} else {
    echo "Email sending failed.";
    print_r(error_get_last());
}
?>