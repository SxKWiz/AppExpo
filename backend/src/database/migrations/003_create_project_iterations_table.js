export const up = async (knex) => {
  return knex.schema.createTable('project_iterations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('project_id').references('id').inTable('projects').onDelete('CASCADE');
    table.text('modification_prompt').notNullable();
    table.jsonb('app_specification').notNullable();
    table.jsonb('generated_files').notNullable();
    table.integer('version').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.index(['project_id']);
    table.index(['version']);
  });
};

export const down = async (knex) => {
  return knex.schema.dropTable('project_iterations');
};