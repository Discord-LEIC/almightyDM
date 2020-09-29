const { Guild, Permissions } = require("discord.js");

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


const permissions = [
    Permissions.FLAGS.ADMINISTRATOR,
    Permissions.FLAGS.CREATE_INSTANT_INVITE,
    Permissions.FLAGS.KICK_MEMBERS,
    Permissions.FLAGS.BAN_MEMBERS,
    Permissions.FLAGS.MANAGE_CHANNELS,
    Permissions.FLAGS.MANAGE_GUILD,
    Permissions.FLAGS.ADD_REACTIONS,
    Permissions.FLAGS.VIEW_AUDIT_LOG,
    Permissions.FLAGS.PRIORITY_SPEAKER,
    Permissions.FLAGS.STREAM,
    Permissions.FLAGS.VIEW_CHANNEL,
    Permissions.FLAGS.SEND_MESSAGES,
    Permissions.FLAGS.SEND_TTS_MESSAGES,
    Permissions.FLAGS.MANAGE_MESSAGES,
    Permissions.FLAGS.EMBED_LINKS,
    Permissions.FLAGS.ATTACH_FILES,
    Permissions.FLAGS.READ_MESSAGE_HISTORY,
    Permissions.FLAGS.MENTION_EVERYONE,
    Permissions.FLAGS.USE_EXTERNAL_EMOJIS,
    Permissions.FLAGS.VIEW_GUILD_INSIGHTS,
    Permissions.FLAGS.CONNECT,
    Permissions.FLAGS.SPEAK,
    Permissions.FLAGS.MUTE_MEMBERS,
    Permissions.FLAGS.DEAFEN_MEMBERS,
    Permissions.FLAGS.MOVE_MEMBERS,
    Permissions.FLAGS.USE_VAD,
    Permissions.FLAGS.CHANGE_NICKNAME,
    Permissions.FLAGS.MANAGE_NICKNAMES,
    Permissions.FLAGS.MANAGE_ROLES,
    Permissions.FLAGS.MANAGE_WEBHOOKS,
    Permissions.FLAGS.MANAGE_EMOJIS
];

function generate_permissions(roleId, allowed) {
    return {
        'id': roleId,
        'type': 'role',
        'deny': permissions.filter(p => !allowed.includes(p)),
        'allow': allowed
    };
}



//const guildID = config.guildID;

async function setup_server(serverGuild) {
    // TODO: CLEAR SERVER SETTINGS


    // TODO: generate section Staff
    // TODO: generate channel #puppet-master // commands
    // TODO: generate channel #testing       // testing
    // TODO: generate channel #genesis       // admin-text
    // TODO: generate channel $admin-voice   // admin-voice


    console.log("Setting up server");

    const everyoneRoleId = serverGuild.id;
    // const afonsoRoleId = '760554850907062402';


    // TODO: generate section Welcome
    let welcomeCategory = await create_channel(serverGuild, 'Welcome', {
        'type': 'category'
    });


    // TODO: send welcome message to this channel
    // nobody can write in this channel!
    let welcomeText = await create_channel(serverGuild, 'welcome', {
        'type': 'text',
        'parent': welcomeCategory.id,
        'permissionOverwrites': [
            generate_permissions(everyoneRoleId, [
                Permissions.FLAGS.VIEW_CHANNEL,
                Permissions.FLAGS.READ_MESSAGE_HISTORY
            ])
        ]
    });

    // TODO: send rules message to this channel
    let rulesText = await create_channel(serverGuild, 'rules', {
        'type': 'text',
        'parent': welcomeCategory.id,
        'permissionOverwrites': [
            generate_permissions(everyoneRoleId, [
                Permissions.FLAGS.VIEW_CHANNEL,
                Permissions.FLAGS.READ_MESSAGE_HISTORY
            ])
        ]
    });

    let degreeTextID = await create_channel(serverGuild, 'enroll-degree', {
        'type': 'text',
        'parent': welcomeCategory.id,
        'permissionOverwrites': [
            generate_permissions(everyoneRoleId, [
                Permissions.FLAGS.VIEW_CHANNEL,
                Permissions.FLAGS.READ_MESSAGE_HISTORY,
                Permissions.FLAGS.ADD_REACTIONS
            ])
        ]
    });

    let announcementsCategory = await create_channel(serverGuild, 'Announcements', {
        'type': 'category'
    });

    // TODO: generate section Course Discussion
    let discussionCategory = await create_channel(serverGuild, 'Discussion', {
        'type': 'category'
    });

    let degrees = get_degrees(targets);
    console.log(`[+] Got degrees ${degrees}`);

    let courses_db = {}
    for(const degree of degrees) {

        let degreeRoleName = degree.acronym === 'MEIC-A' ? 'MEIC' : degree.acronym;
        degreeRole = await create_role(serverGuild, {
            'data': {
                'name': degreeRoleName,
                'mentionable': true
            }
        });

        continue;

        // TODO: send message to enroll-campi with degree (DONT FORGET TO REACT TO MESSAGE)
        let enrollmentMsgId = Math.floor(Math.random() * 100000000);
        enrollment_mappings[enrollmentMsgId] = degreeRoleId.toString();
        console.log(`[+] Sending enrollment message to #enroll-campi with id ${enrollmentMsgId}`);


        // TODO: create enrollment channel for degree
        // ninguem pode escrever
        let enrollChannelName = `enroll-${degreeRoleName}`;
        let enrollChannelId = await create_channel(serverGuild, 'Discussion', 'category',  [{deny: ['SEND_MESSAGES']}]);
        
        console.log(`[+] Creating enrollment channel ${enrollChannelName} with id ${enrollChannelId}`);


        console.log(`[+] Retrieving courses from ${degree.acronym}...`);
        let courses = get_courses(degree.id);
        for(const course of courses) {

            // TODO TODO: verificar se o role esta duplicado

            // TODO: generate course role
            let courseRoleName = `${course.acronym}-`;
            if(!(degreeRoleName === "MEIC")) {
                courseRoleName += `${get_degree_letter(degreeRoleName)}`;
            }
            let courseRoleId = Math.floor(Math.random() * 100000000);
            console.log(`[+] Creating role ${courseRoleName} with id ${courseRoleId}`);

            // TODO: send enrollment message to enrollment channel (DONT FORGET TO REACT TO MESSAGE)
            let enrollmentMsgId = Math.floor(Math.random() * 100000000);
            enrollment_mappings[enrollmentMsgId] = courseRoleId.toString();
            console.log(`[+] Sending enrollment message to channel ${enrollChannelName} with id ${enrollmentMsgId}`);


            // TODO: generate course channels (DONT FORGET TO SET PERMISSIONS!)
            let announcementChannelName = `${courseRoleName}a`;
            let announcementChannelId = await create_channel(serverGuild, announcementChannelName, 0, 0);
            console.log(`[+] Generating channel ${announcementChannelName} for degree ${degreeRoleName} with id ${announcementChannelId}`);

            let discussionChannelName = `${courseRoleName}d`;
            let discussionChannelId = await create_channel(serverGuild, announcementChannelName, 0, 0);
            console.log(`[+] Generating channel ${discussionChannelName} for degree ${degreeRoleName} with id ${discussionChannelId}`);

            course['announcements'] = announcementChannelId.toString();
        }

        courses_db[degreeRoleName] = courses;
    }

    console.log(enrollment_mappings);
    console.log(courses_db);
}

async function create_channel(serverGuild, name, options){
    let channel = await serverGuild.channels.create(name, options)
        .catch(console.error);
    console.log(`[+] Creating ${options.type} channel ${name} with id ${channel.id}`);

    return channel;
}

async function create_role(serverGuild, options) {
    let role = await serverGuild.roles.create(options)
        .catch(console.error);
    console.log(`[+] Creating role ${role.name} with id ${role.id}`);

    return role;
}

function get_guild(){
    return;
}

function get_degree_letter(degree_name) {
    let mapping = {
        "LEIC-A": "a",
        "LEIC-T": "t",
        "MEIC": "m"
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
        let term = course.academicTerm[0]; // get the number

        if(term === '2') continue; // TODO: remove this. for the sake of time we need it here
        // PLEASE SAVE US

        let acronym = get_acronym(course.name, course.acronym);
        let academicYear = get_academic_year("-");
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


function httpGet(url) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", url, false ); // false for synchronous request
    xmlHttp.send( null );
    return JSON.parse(xmlHttp.responseText);
}

module.exports.create_channel = create_channel;
module.exports.setup_server = setup_server;

// TODO: REMOVE WHEN NOT NEEDED
/*
async function setup() {
    var courses = ["FP", "IAC", "IEI", "AL", "CDI-I", "IAED", "LP", "MD", "CDI-II", "SO", "PO", "ACED", "MO", "Ges", "ASA", "IPM", "TC", "EO", "PE", "BD", "CG", "IA", "OC", "RC", "AMS", "Compiladores", "CS", "ES", "SD"];

    var instructions = "Reage com :raised_hand: na mensagem da respetiva cadeira para teres acesso ao seu canal de discussão e receberes notificações dos anúncios dessa cadeira. Para reverter a ação, basta retirar a reação na mensagem correspondente.";
    
    let subscriptionChannel = get_channel(subscriptionChannelID);
    for(let course of courses) {
        // console.log(`[${course}]`);
        let message = await subscriptionChannel.send(`[${course}]`);
        message.react(roleSelectionEmoji);
        console.log(`${course}: ${message.id}`);
    }

    // console.log(instructions);
    subscriptionChannel.send(instructions);
    
}
*/

