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
        await conn.query(`CREATE OR REPLACE TABLE courses (ist_id VARCHAR(32) NOT NULL, name VARCHAR(128) NOT NULL, \
            fenix_acronym VARCHAR(64) NOT NULL, custom_acronym VARCHAR(16) PRIMARY KEY, degree ENUM('LEIC-A', 'LEIC-T', 'MEIC'), \
            academic_year VARCHAR(16) NOT NULL, academic_term VARCHAR(1) NOT NULL, announcement_channel_id VARCHAR(32) NOT NULL UNIQUE KEY, \
            rss_link VARCHAR(128) NOT NULL)`);
        
        await conn.query(`CREATE OR REPLACE TABLE roles (discord_id VARCHAR(32) PRIMARY KEY, name VARCHAR(128) NOT NULL UNIQUE KEY, \
            color CHAR(6) NOT NULL, subscription_message_id VARCHAR(32) NOT NULL UNIQUE KEY, course_custom_acronym VARCHAR(16) NOT NULL UNIQUE KEY, \
            CONSTRAINT fk_roles_courses \
                FOREIGN KEY (course_custom_acronym) REFERENCES courses(custom_acronym) \
                ON DELETE RESTRICT \
                ON UPDATE RESTRICT)`);

    } catch (err) {
        console.log(err);
    } finally {
        if (conn) conn.release(); //release to pool
    }
}

async function insertCourse(ist_id, name, fenix_acronym, custom_acronym, degree, academic_year, academic_term, announcement_channel_id, rss_link) {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query(`INSERT INTO courses VALUES ('${ist_id}', '${name}', '${fenix_acronym}', '${custom_acronym}', \
            '${degree}', '${academic_year}', '${academic_term}', '${announcement_channel_id}', '${rss_link}')`);

    } catch (err) {
        console.log(err);
    } finally {
        if (conn) conn.release(); //release to pool
    }
}

async function insertRole(discord_id, name, color, subscription_message_id, course_id) {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query(`INSERT INTO roles VALUES ('${discord_id}', '${name}', '${color}', '${subscription_message_id}', '${course_id}')`);

    } catch (err) {
        console.log(err);
    } finally {
        if (conn) conn.release(); //release to pool
    }
}

async function insertAnnouncement() {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query(``);

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

async function getCourses() {
    let conn;
    try {
        conn = await pool.getConnection();
        result = await conn.query(`SELECT degree, fenix_acronym, custom_acronym, rss_link, \
            announcement_channel_id FROM courses`);
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
    insertCourse: insertCourse,
    insertRole: insertRole,
    insertAnnouncement: insertAnnouncement,
    getRole: getRole,
    getCourses: getCourses
  };

