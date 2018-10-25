const { io } = require('../server');
const { Usuarios } = require('../classes/usuario');
const { crearMensajes } = require('../utils/utils');

let usuarios = new Usuarios();

io.on('connection', (client) => {

    client.on('entrarChat', (data, callback) => {
        if (!data.nombre || !data.sala) {
            return callback({
                err: true,
                message: 'El nombre/sala es necesario'
            });
        }
        client.join(data.sala);

        usuarios.agregarPersona(client.id, data.nombre, data.sala);
        client.broadcast.to(data.sala).emit('listaPersonas', usuarios.getPersonasPorSala(data.sala));

        callback(usuarios.getPersonasPorSala(data.sala));
    });

    client.on('crearMensaje', (data) => {
        let personas = usuarios.getPersona(client.id);

        let mensaje = crearMensajes(personas.nombre, data.mensaje);
        client.broadcast.to(personas.sala).emit('crearMensaje', mensaje)
    })

    client.on('disconnect', () => {
        let personaBorrada = usuarios.borrarPersona(client.id);
        let mensaje = {
            usuario: 'Admin',
            mensaje: `${personaBorrada.nombre} ha abandonado el chat`
        };
        client.broadcast.to(personaBorrada.sala).emit('mensajeSalida', crearMensajes('Admin', `${personaBorrada.nombre} ha abandonado el chat`));
        client.broadcast.to(personaBorrada.sala).emit('listaPersonas', usuarios.getPersonasPorSala(personaBorrada.sala));
    })

    //Mensaje privado
    client.on('mensajePrivado', data=>{

        let persona = usuarios.getPersona(client.id);

        client.broadcast.to(data.para).emit('mensajePrivado', crearMensajes( persona.id, data.mensaje ));
    })

});