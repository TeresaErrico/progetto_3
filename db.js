// Importazione dei moduli necessari
const http = require('http');
const querystring = require('querystring');
const mysql = require('mysql2');

// Configurazione del database
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'stage2024!',
    database: 'form_contatti'
});

// Connessione al database
db.connect((err) => {
    if (err) {
        console.error('Errore durante la connessione al database:', err);
    } else {
        console.log('Connesso al database.');
    }
});

// API 1: Invio contatto
const handleContactSubmission = (req, res) => {
    if (req.method === 'POST' && req.url === '/api/invio-contatto') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            const postData = querystring.parse(body);
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(postData.email)) {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('Email non valida.');
                return;
            }

            db.query('SELECT * FROM contatti WHERE email = ?',
                [postData.email], (error, results) => {
                    if (error) {
                        console.error(error);
                        res.writeHead(500, { 'Content-Type': 'text/plain' });
                        res.end('Errore interno del server.');
                        return;
                    }

                    if (results.length > 0) {
                        res.writeHead(400, { 'Content-Type': 'text/plain' });
                        res.end('Hai già inviato una richiesta di contatto.');
                        return;
                    }

                    db.query('INSERT INTO contatti (nome, email, messaggio) VALUES (?, ?, ?)',
                        [postData.nome, postData.email, postData.messaggio], (err) => {
                        if (err) {
                            console.error(err);
                            res.writeHead(500, { 'Content-Type': 'text/plain' });
                            res.end('Errore interno del server.');
                            return;
                        }

                        res.writeHead(200, { 'Content-Type': 'text/plain' });
                        res.end('Contatto inviato con successo.');
                    });
                });
        });
    }
};

// API 2: Lista contatti con risposte
const handleContactList = (req, res) => {
    console.log("Richiesta ricevuta per /api/lista-contatti");
    if (req.method === 'GET' && req.url === '/api/lista-contatti') {
        db.query(`
       SELECT c.id, c.nome, c.email, c.messaggio, r.nome_admin,
r.messaggio_risposta
       FROM contatti c
       LEFT JOIN risposte r ON c.id = r.id_risposta`,
            (error, results) => {
                if (error) {
                    console.error(error);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        error: 'Errore interno del server.'
                    }));
                    return;
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(results));
            });
    }
};

// API 3: Invia risposta a un contatto
const handleContactResponse = (req, res) => {
    if (req.method === 'POST' && req.url === '/api/contatto-risposta') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            const postData = querystring.parse(body);
            const contactId = postData.id;
            const adminName = postData.nome_admin;
            const responseMessage = postData.messaggio_risposta;

            console.log('Contact ID:', contactId); // Debug

            // Controllo se l'ID è un numero e non zero
            if (isNaN(contactId) || contactId <= 0) {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('Hai inserito una tipologia di dato errato: devi inserire un numero.');
         return;
            }

            // Controllo se il contatto esiste
            db.query('SELECT * FROM contatti WHERE id = ?', [contactId],
                (error, results) => {
                    if (error) {
                        console.error(error);
                        res.writeHead(500, { 'Content-Type': 'text/plain' });
                        res.end('Errore interno del server.');
                        return;
                    }

                    if (results.length === 0) {
                        res.writeHead(404, { 'Content-Type': 'text/plain' });
                        res.end('Non esiste nessun contatto con questo ID.');
                        return;
                    }

                    // Controllo se esiste già una risposta
                    db.query('SELECT * FROM risposte WHERE contatto_id = ?',
                        [contactId], (error, results) => {
                            if (error) {
                                console.error(error);
                                res.writeHead(500, { 'Content-Type': 'text/plain' });
                                res.end('Errore interno del server.');
                                return;
                            }

                            if (results.length > 0) {
                                res.writeHead(400, { 'Content-Type': 'text/plain' });
                                res.end('Esiste già una risposta per questo contatto.');
                                return;
                            }

                            // Inserimento della nuova risposta
                            db.query('INSERT INTO risposte (contatto_id, nome_admin, messaggio_risposta) VALUES(?, ?, ?)',
                            [contactId, adminName, responseMessage], (err) => {
                                if (err) {
                                    console.error(err);
                                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                                    res.end('Errore interno del server.');
                                    return;
                                }

                                res.writeHead(200, { 'Content-Type': 'text/plain' });
                                res.end('Risposta salvata con successo.');
                            });
                });
        });
    });
}
};


// API 4: Modifica risposta a un contatto
const handleUpdateResponse = (req, res) => {
    if (req.method === 'PATCH' && req.url === '/api/risposta') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            const postData = querystring.parse(body);
            const responseId = postData.id_risposta;
            const newResponseMessage = postData.messaggio_risposta;

            console.log('Response ID:', responseId); // Debug

            // Controllo se l'ID è un numero e non zero
            if (isNaN(responseId) || responseId <= 0) {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('Hai inserito una tipologia di dato errato: devi inserire un numero.');
         return;
            }

            // Controllo se esiste una risposta
            db.query('SELECT * FROM risposte WHERE id_risposta = ?',
                [responseId], (error, results) => {
                    if (error) {
                        console.error(error);
                        res.writeHead(500, { 'Content-Type': 'text/plain' });
                        res.end('Errore interno del server.');
                        return;
                    }

                    if (results.length === 0) {
                        res.writeHead(404, { 'Content-Type': 'text/plain' });
                        res.end('Non esiste nessuna risposta con questo id.');
                        return;
                    }

                    // Aggiornamento della risposta
                    db.query('UPDATE risposte SET messaggio_risposta = ? WHERE id_risposta = ? ',
                        [newResponseMessage, responseId], (err) => {
                            if (err) {
                                console.error(err);
                                res.writeHead(500, { 'Content-Type': 'text/plain' });
                                res.end('Errore interno del server.');
                                return;
                            }

                            res.writeHead(200, { 'Content-Type': 'text/plain' });
                            res.end('Risposta modificata con successo.');
                        });
                });
        });
    }
};


// API 5: Elimina un contatto e la sua risposta
const handleDeleteContact = (req, res) => {
    if (req.method === 'DELETE' && req.url === '/api/elimina-contatti') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            // Parsing dei dati URL-encoded
            const postData = querystring.parse(body);
            const contactId = postData.id;

            // Controllo se l'ID è un numero e non zero
            if (isNaN(contactId) || contactId <= 0) {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('Hai inserito una tipologia di dato errato: devi inserire un numero.');
         return;
            }

            // Controllo se il contatto esiste
            db.query('SELECT * FROM contatti WHERE id = ?', [contactId],
                (error, results) => {
                    if (error) {
                        console.error(error);
                        res.writeHead(500, { 'Content-Type': 'text/plain' });
                        res.end('Errore interno del server.');
                        return;
                    }

                    if (results.length === 0) {
                        res.writeHead(404, { 'Content-Type': 'text/plain' });
                        res.end('Non esiste nessun contatto con questo id.');
                        return;
                    }

                    // Eliminazione del contatto
                    db.query('DELETE FROM contatti WHERE id = ?', [contactId],
                        (err) => {
                            if (err) {
                                console.error(err);
                                res.writeHead(500, { 'Content-Type': 'text/plain' });
                                res.end('Errore interno del server.');
                                return;
                            }

                            res.writeHead(200, { 'Content-Type': 'text/plain' });
                            res.end('Contatto eliminato con successo.');
                        });
                });
        });
    }
};






// Creazione del server
const server = http.createServer((req, res) => {
    handleContactSubmission(req, res); // API 1
    handleContactList(req, res);       // API 2
    handleContactResponse(req, res);   // API 3
    handleUpdateResponse(req, res);     // API 4
    handleDeleteContact(req, res);      // API 5
});

// Avvio del server
server.listen(3001, () => {
    console.log(`Server in esecuzione su http://localhost:3001.`);
});