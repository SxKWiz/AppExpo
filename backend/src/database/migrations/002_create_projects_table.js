export const up = async (knex) => {
  return knex.schema.createTable('projects', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('name').notNullable();
    table.text('description');
    table.text('original_prompt').notNullable();
    table.jsonb('app_specification').notNullable();
    table.jsonb('generated_files').notNullable();
    table.jsonb('assets').defaultTo('{}');
    table.integer('version').defaultTo(1);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.index(['user_id']);
    table.index(['created_at']);
  });
};

export const down = async (knex) => {
  return knex.schema.dropTable('projects');
};