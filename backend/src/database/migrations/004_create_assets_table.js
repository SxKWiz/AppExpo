export const up = async (knex) => {
  return knex.schema.createTable('assets', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('project_id').references('id').inTable('projects').onDelete('CASCADE');
    table.string('filename').notNullable();
    table.string('original_filename').notNullable();
    table.string('mime_type').notNullable();
    table.integer('file_size').notNullable();
    table.string('storage_path').notNullable();
    table.string('public_url');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.index(['project_id']);
  });
};

export const down = async (knex) => {
  return knex.schema.dropTable('assets');
};