const connection = require('../database/connection');

module.exports = {
    async listAll(request, response) {
        const { page = 1, perPage = 5 } = request.query;

        const [count] = await connection('incidents').count();

        if(perPage > 10)
            perPage = 10;

        const incidents = await connection('incidents')
        .join('ongs', 'ongs.id', '=', 'incidents.ong_id')
        .limit(perPage)
        .offset((page - 1) * perPage)
        .select([
            'incidents.*',
            'ongs.name',
            'ongs.email',
            'ongs.whatsapp',
            'ongs.city',
            'ongs.uf'
        ]);

        response.header('X-Total-Count', count['count(*)']);

        return response.json(incidents);
    },

    async create(request, response) {
        const { title, description, value } = request.body;

        const ong_id = request.headers.authorization;

        const [id] = await connection('incidents').insert({
            title,
            description,
            value,
            ong_id
        });
        return response.json({ id });
    },

    async delete(request, response) {
        const { id } = request.params;
        const ong_id = request.headers.authorization;

        const incident = await connection('incidents')
            .where('id', id)
            .select('ong_id')
            .first();
        
        if(incident.ong_id != ong_id){
            return response.status(401).json({ error: 'Operation not Permitted.' });
        }

        await connection('incidents').where('id', id).delete();

        return response.status(204).send();

    }
}