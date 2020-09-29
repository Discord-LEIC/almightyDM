const { Guild } = require("discord.js");

const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

let GET_DEGREES_URL = "https://fenix.tecnico.ulisboa.pt/api/fenix/v1/degrees"
let GET_COURSES_URL = "https://fenix.tecnico.ulisboa.pt/api/fenix/v1/degrees/{}/courses?academicTerm={}"

let targets = ["LEIC-A", "LEIC-T", "MEIC-A"];

let excludedCourses = [
    "Opção Livre 1",
    "Opção Livre 2",
    "Opção Livre 3",
    "Projecto de Mestrado em Engenharia Informática e de Computadores",
    "Dissertação - Mestrado em Engenharia Informática e de Computadores",
];


// config objects
let enrollment_mappings = {}

let roles = {}

//const guildID = config.guildID;

function setup_server() {
    // TODO: CLEAR SERVER SETTINGS
    let serverGuild = get_guild();

    // TODO: generate section Welcome
    let welcomeID = Math.floor(Math.random() * 100000000);
    create_channel(serverGuild, 'Welcome', welcomeID, 'category',  [{deny: ['SEND_MESSAGES']}]);
    console.log(`[+] Creating category Welcome with id ${welcomeID}`);

    // TODO: generate #welcome
    let welcomeTextID = Math.floor(Math.random() * 100000000);
    create_channel(serverGuild, 'welcome', welcomeTextID, 'text',  [{deny: ['SEND_MESSAGES']}]);
    console.log(`[+] Creating text channel welcome with id ${welcomeTextID}`);

    // TODO: generate #rules
    let rulesTextID = Math.floor(Math.random() * 100000000);
    create_channel(serverGuild, 'rules', rulesTextID, 'text',  [{deny: ['SEND_MESSAGES']}]);
    console.log(`[+] Creating text channel rules with id ${rulesTextID}`);

    // TODO: generate #enroll-degree
    let degreeTextID = Math.floor(Math.random() * 100000000);
    create_channel(serverGuild, 'enroll-degree', degreeTextID, 'text',  [{deny: ['SEND_MESSAGES']}]);
    console.log(`[+] Creating text channel enroll-degree with id ${degreeTextID}`);

    // TODO: generate #enroll-year
    let yearTextID = Math.floor(Math.random() * 100000000);
    create_channel(serverGuild, 'enroll-year', yearTextID, 'text',  [{deny: ['SEND_MESSAGES']}]);
    console.log(`[+] Creating text channel enroll-year with id ${yearTextID}`);

    // TODO: generate section Course Announcements
    let announcementsID = Math.floor(Math.random() * 100000000);
    create_channel(serverGuild, 'Announcements',announcementsID, 'category',  [{deny: ['SEND_MESSAGES']}]);
    console.log(`[+] Creating category Announcements with id ${announcementsID}`);

    // TODO: generate section Course Discussion
    let discussionID = Math.floor(Math.random() * 100000000);
    create_channel(serverGuild, 'Discussion', discussionID, 'category',  [{deny: ['SEND_MESSAGES']}]);
    console.log(`[+] Creating category Announcements with id ${discussionID}`);

    // get courses
    let degrees = get_degrees(targets);
    for(const degree of degrees) {

        // TODO: generate degree role (LEIC-A, LEIC-T, MEIC)
        let rolename = degree.acronym === 'MEIC-A' ? 'MEIC' : degree.acronym;
        let roleid = Math.floor(Math.random() * 100000000);
        console.log(`[+] Generating role ${rolename} with id ${roleid}`);


        // TODO: send message to enroll-campi with degree (DONT FORGET TO REACT TO MESSAGE)
        let enrollmentMsgId = Math.floor(Math.random() * 100000000);
        enrollment_mappings[enrollmentMsgId] = roleid;
        console.log(`[+] Sending enrollment message to #enroll-campi with id ${enrollmentMsgId}`);


        // TODO: create enrollment channel for degree
        let enrollChannelName = `enroll-${rolename}`;
        let enrollChannelId = Math.floor(Math.random() * 100000000);
        console.log(`[+] Creating enrollment channel ${enrollChannelName} with id ${enrollChannelId}`);


        console.log(`[+] Retrieving courses from ${degree.acronym}...`);
        let courses = get_courses(degree.id);
        for(const course of courses) {

            // TODO TODO: verificar se o role esta duplicado

            // TODO: generate course role
            let courseRoleName = course.acronym;
            let courseRoleId = Math.floor(Math.random() * 100000000);
            console.log(`[+] Creating role ${courseRoleName} with id ${courseRoleId}`);

            // TODO: send enrollment message to enrollment channel (DONT FORGET TO REACT TO MESSAGE)
            let enrollmentMsgId = Math.floor(Math.random() * 100000000);
            enrollment_mappings[enrollmentMsgId] = courseRoleId;
            console.log(`[+] Sending enrollment message to channel ${enrollChannelName} with id ${enrollmentMsgId}`);


            // TODO: generate course channels (DONT FORGET TO SET PERMISSIONS!)
            let announcementChannelName = `${courseRoleName}-${get_degree_letter(degree.acronym)}a`;
            let announcementChannelId = Math.floor(Math.random() * 100000000);
            console.log(`[+] Generating channel ${announcementChannelName} for degree ${degree.acronym} with id ${announcementChannelId}`);

            let discussionChannelName = `${courseRoleName}-${get_degree_letter(degree.acronym)}d`;
            let discussionChannelId = Math.floor(Math.random() * 100000000);
            console.log(`[+] Generating channel ${discussionChannelName} for degree ${degree.acronym} with id ${discussionChannelId}`);

        }
    }

    // console.log(courses);
}

function create_channel(serverGuild, name, id, type, pOverwrite){
    return;
    serverGuild.channels.create(name, {
        id: id,
        type: type,
        permissionOverwrites: pOverwrite
    })
    .then(console.log)
    .catch(console.error);
}

function get_guild(){
    return;
}

function get_degree_letter(degree_name) {
    let mapping = {
        "LEIC-A": "a",
        "LEIC-T": "t",
        "MEIC-A": "m"
    };
    return mapping[degree_name];
}

function get_degrees(target_degree) {
    console.log("[+] Retrieving degrees...");
    let degrees = httpGet(GET_DEGREES_URL);
    degrees = degrees.filter((course) => target_degree.includes(course.acronym));

    let res = []
    for(const d of degrees) {
        res.push({
            'acronym': d.acronym,
            'id': d.id
        });
    }
    return res;
}

function get_courses(degreeId) {
    let semester = "2019/2020";
    let url = `https://fenix.tecnico.ulisboa.pt/api/fenix/v1/degrees/${degreeId}/courses?academicTerm=${semester}`
    let courses = httpGet(url)

    // filter out black listed courses >:(
    courses = courses.filter(course => !excludedCourses.includes(course.name));

    let res = []
    for(const course of courses) {
        let acronym = get_acronym(course.name, course.acronym);
        let academicYear = get_academic_year("-");
        let term = course.academicTerm[0]; // get the number
        let rss = `https://fenix.tecnico.ulisboa.pt/disciplinas/${course.acronym}/${academicYear}/${term}-semestre/rss/announcement`;

        res.push({
            'name': course.name,
            'acronym': acronym,
            'id': course.id,
            'term': course.academicTerm[0],
            'rss': rss
        });
    }

    return res;
}

function get_acronym(name, acronym) {
    let customAcronyms = {
        "Cálculo Diferencial e Integral I": "CDI-I",
        "Cálculo Diferencial e Integral II": "CDI-II",
        "Gestão": "Ges",
        "Compiladores": "Compiladores",
        "Opção Livre 1": "OL1",
        "Opção Livre 2": "OL2",
        "Opção Livre 3": "OL3",
        "Portfolio Pessoal 1": "PP1",
        "Portfolio Pessoal 2": "PP2",
        "Linguagens de Programação": "LingP",
        "Aprendizagem": "Apr",
        "Bioinformática / Biologia Computacional ": "BioInf",
        "Dissertação - Mestrado em Engenharia Informática e de Computadores": "Dissert",
        "Projecto de Mestrado em Engenharia Informática e de Computadores": "ProjTese"
    }

    if(name in customAcronyms) {
        return customAcronyms[name];
    } else {
        return acronym.replace(/[\s0-9a-z]/g, ''); // remove lowercase and digits
    }
}


function get_academic_year(separator) {
    let now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth() + 1;

    let baseYear = month>=8 ? year : year-1;
    return `${baseYear}${separator}${baseYear+1}`;
}


function httpGet(url)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", url, false ); // false for synchronous request
    xmlHttp.send( null );
    return JSON.parse(xmlHttp.responseText);
}

setup_server();
