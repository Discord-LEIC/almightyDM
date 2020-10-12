const mariadb = require('mariadb');

let pool;

async function createPool() {
    pool = mariadb.createPool({
        host: 'localhost', 
        database: 'teste', 
        user:'root', 
        password: '123'
    });
}

async function createTables() {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query(`CREATE OR REPLACE TABLE students (ist_id VARCHAR(15) PRIMARY KEY, discord_id VARCHAR(32) NOT NULL UNIQUE KEY, \
            name VARCHAR(128) NOT NULL, birthday DATE NOT NULL)`);

        await conn.query(`CREATE OR REPLACE TABLE courses (ist_id VARCHAR(32) NOT NULL, name VARCHAR(128) NOT NULL, color CHAR(6) NOT NULL, \
            fenix_acronym VARCHAR(64) NOT NULL, custom_acronym VARCHAR(16) PRIMARY KEY, degree ENUM('LEIC-A', 'LEIC-T', 'MEIC'), \
            academic_year VARCHAR(16) NOT NULL, academic_term VARCHAR(1) NOT NULL, announcement_channel_id VARCHAR(32) NOT NULL UNIQUE KEY, \
            rss_link VARCHAR(128) NOT NULL)`);
        
        await conn.query(`CREATE OR REPLACE TABLE roles (discord_id VARCHAR(32) PRIMARY KEY, name VARCHAR(128) NOT NULL UNIQUE KEY, \
            color CHAR(6) NOT NULL, subscription_message_id VARCHAR(32) NOT NULL UNIQUE KEY, course_custom_acronym VARCHAR(16) NOT NULL UNIQUE KEY, \
            CONSTRAINT fk_roles_courses \
                FOREIGN KEY (course_custom_acronym) REFERENCES courses(custom_acronym) \
                ON DELETE RESTRICT \
                ON UPDATE RESTRICT)`);
        
        await conn.query(`CREATE OR REPLACE TABLE announcements (guid VARCHAR(32) PRIMARY KEY, ts TIMESTAMP NOT NULL, \
            permalink VARCHAR(128) NOT NULL UNIQUE KEY, author VARCHAR(128) NOT NULL, title VARCHAR(128) NOT NULL, \
            description_hash VARCHAR(64) NOT NULL, course_custom_acronym VARCHAR(32) NOT NULL, \
            CONSTRAINT fk_announcements_courses \
                FOREIGN KEY (course_custom_acronym) REFERENCES courses(custom_acronym) \
                ON DELETE RESTRICT \
                ON UPDATE RESTRICT)`);

    } catch (err) {
        console.log(err);
    } finally {
        if (conn) conn.release(); //release to pool
    }
}

async function insertStudent(ist_id, discord_id, name, birthday) {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query(`INSERT INTO students VALUES ('${ist_id}', '${discord_id}', '${name}', '${birthday}')`);

    } catch (err) {
        console.log(err);
    } finally {
        if (conn) conn.release(); //release to pool
    }
}

async function insertCourse(ist_id, name, color, fenix_acronym, custom_acronym, degree, academic_year, academic_term, announcement_channel_id, rss_link) {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query(`INSERT INTO courses VALUES ('${ist_id}', '${name}', '${color}', '${fenix_acronym}', '${custom_acronym}', \
            '${degree}', '${academic_year}', '${academic_term}', '${announcement_channel_id}', '${rss_link}')`);

    } catch (err) {
        console.log(err);
    } finally {
        if (conn) conn.release(); //release to pool
    }
}

async function insertRole(discord_id, name, color, subscription_message_id, course_custom_acronym) {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query(`INSERT INTO roles VALUES ('${discord_id}', '${name}', '${color}', \
            '${subscription_message_id}', '${course_custom_acronym}')`);

    } catch (err) {
        console.log(err);
    } finally {
        if (conn) conn.release(); //release to pool
    }
}

async function insertAnnouncement(guid, ts, permalink, author, title, description_hash, course_custom_acronym) {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query(`INSERT INTO announcements VALUES ('${guid}', '${ts}', '${permalink}', \
            '${author}', '${title}', '${description_hash}', '${course_custom_acronym}')`);

    } catch (err) {
        console.log(err);
    } finally {
        if (conn) conn.release(); //release to pool
    }
}

async function getStudent(ist_id) {
    let conn;
    try {
        conn = await pool.getConnection();
        result = await conn.query(`SELECT EXISTS (SELECT * FROM students WHERE \ 
            ist_id = ${ist_id})`);
        return result;

    } catch (err) {
        console.log(err);
    } finally {
        if (conn) conn.release(); //release to pool
    }
}

async function getCourses() {
    let conn;
    try {
        conn = await pool.getConnection();
        result = await conn.query(`SELECT degree, fenix_acronym, custom_acronym, rss_link, \
            announcement_channel_id, color FROM courses`);
        return result;

    } catch (err) {
        console.log(err);
    } finally {
        if (conn) conn.release(); //release to pool
    }
}

async function getRole(subscription_message_id) {
    let conn;
    try {
        conn = await pool.getConnection();
        result = await conn.query(`SELECT discord_id FROM roles WHERE \ 
            subscription_message_id = ${subscription_message_id}`);
        return result;

    } catch (err) {
        console.log(err);
    } finally {
        if (conn) conn.release(); //release to pool
    }
}

module.exports = {
    createPool: createPool,
    createTables: createTables,
    insertStudent: insertStudent,
    insertCourse: insertCourse,
    insertRole: insertRole,
    insertAnnouncement: insertAnnouncement,
    getStudent: getStudent,
    getCourses: getCourses,
    getRole: getRole
  };

