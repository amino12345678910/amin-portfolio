<?php
/**
 * Simple Contact Form Handler for Shared Hosting
 */

// Basic error handling
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', 'mail_debug.log');

function log_message($msg)
{
    error_log(date('[Y-m-d H:i:s] ') . $msg);
}

// Set content type
header('Content-Type: application/json');

try {
    log_message("New form submission received.");

    // Simple rate limiting
    session_start();
    $now = time();
    if (isset($_SESSION['last_submission']) && ($now - $_SESSION['last_submission']) < 10) {
        log_message("Rate limit hit.");
        throw new Exception('Veuillez attendre quelques secondes entre les soumissions.');
    }

    // Only accept POST requests
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Méthode non autorisée');
    }

    // Verify reCAPTCHA
    $recaptcha_secret = '6dVlkksAAAAALbvuGh2Iu-cz-1M8EPtrPiRDqq8'; // Make sure this is the SECRET KEY, not Site Key
    $recaptcha_response = $_POST['g-recaptcha-response'] ?? '';

    if (empty($recaptcha_response)) {
        // Allow bypass for testing if specific header present (optional, remove in prod if strict)
        // throw new Exception('Veuillez cocher la case "Je ne suis pas un robot"');
    }

    if (!empty($recaptcha_response)) {
        $curl = curl_init();
        curl_setopt_array($curl, [
            CURLOPT_URL => "https://www.google.com/recaptcha/api/siteverify",
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => [
                'secret' => $recaptcha_secret,
                'response' => $recaptcha_response
            ]
        ]);

        $verifyResponse = curl_exec($curl);
        $curlError = curl_error($curl);
        curl_close($curl);

        if ($curlError) {
            log_message("Recaptcha CURL error: " . $curlError);
            // check if we should block or allow on curl error? defaulting to block
            throw new Exception('Erreur de connexion au service de validation.');
        }

        $responseData = json_decode($verifyResponse);
        if (!$responseData->success) {
            log_message("Recaptcha validation failed: " . json_encode($responseData));
            throw new Exception('Vérification anti-robot échouée.');
        }
    }

    // Get and validate form data
    $name = trim($_POST['name'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $clientType = $_POST['clientType'] ?? 'individual';

    // Get subject based on client type
    if ($clientType === 'company') {
        $subject = trim($_POST['subject-company'] ?? $_POST['subject'] ?? '');
    } else {
        $subject = trim($_POST['subject-individual'] ?? $_POST['subject'] ?? '');
    }

    $message = trim($_POST['message'] ?? '');

    // Basic validation
    if (empty($name) || strlen($name) > 100) {
        throw new Exception('Nom requis (max 100 caractères)');
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 320) {
        throw new Exception('Email valide requis');
    }

    if (empty($message) || strlen($message) > 5000) {
        throw new Exception('Message requis (max 5000 caractères)');
    }

    // Company specific fields
    $company = '';
    $position = '';
    $revenue = '';

    if ($clientType === 'company') {
        $company = trim($_POST['company'] ?? '');
        $position = trim($_POST['position'] ?? '');
        $revenue = trim($_POST['revenue'] ?? '');

        if (empty($company)) {
            throw new Exception('Nom de l\'entreprise requis');
        }
    }

    // Sanitize data
    $name = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');
    $email = htmlspecialchars($email, ENT_QUOTES, 'UTF-8');
    $subject = htmlspecialchars($subject, ENT_QUOTES, 'UTF-8');
    $message = htmlspecialchars($message, ENT_QUOTES, 'UTF-8');
    $company = htmlspecialchars($company, ENT_QUOTES, 'UTF-8');

    // Use actual message as subject (truncated to 100 chars)
    $subjectClean = str_replace(["\r", "\n"], " ", $message); // Remove newlines for subject
    $emailSubject = "Contact Safonas: " . (mb_strlen($subjectClean) > 50 ? mb_substr($subjectClean, 0, 50) . '...' : $subjectClean);

    // Build email content
    $emailContent = "Nouveau message depuis le site web Safonas\n\n";
    $emailContent .= "Type de client: " . ($clientType === 'company' ? 'Entreprise' : 'Particulier') . "\n";
    $emailContent .= "Nom: $name\n";
    $emailContent .= "Email: $email\n";

    if ($clientType === 'company' && !empty($company)) {
        $emailContent .= "Entreprise: $company\n";
        if (!empty($position))
            $emailContent .= "Poste: $position\n";
        if (!empty($revenue))
            $emailContent .= "Chiffre d'affaires: $revenue\n";
    }

    $selectedSubject = $subject ?: 'Non spécifié';
    $emailContent .= "Sujet sélectionné: $selectedSubject\n";
    $emailContent .= "Message:\n$message\n\n";
    $emailContent .= "---\n";
    $emailContent .= "Date: " . date('d/m/Y H:i:s') . "\n";
    $emailContent .= "IP: " . $_SERVER['REMOTE_ADDR'] . "\n";

    // Email headers
    $recipient = 'hello@safonas.com'; // Target email

    // Using a fixed From address to avoid SPF/DMARC issues
    // The user's email is set as Reply-To
    $headers = [
        'From: noreply@safonas.com',
        'Reply-To: ' . $email,
        'X-Mailer: PHP/' . phpversion(),
        'Content-Type: text/plain; charset=UTF-8'
    ];

    log_message("Attempting to send email to $recipient");

    // Send email
    $sent = mail($recipient, $emailSubject, $emailContent, implode("\r\n", $headers));

    if ($sent) {
        log_message("Email sent successfully.");
        // Update rate limiting
        $_SESSION['last_submission'] = $now;

        // Success response
        echo json_encode([
            'success' => true,
            'status' => 'success',
            'message' => 'Message envoyé avec succès ! Nous vous répondrons dans les 24h.'
        ]);
    } else {
        log_message("Mail function returned false. Check server mail logs.");
        throw new Exception('Erreur serveur lors de l\'envoi de l\'email.');
    }

} catch (Exception $e) {
    log_message("Error: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?>