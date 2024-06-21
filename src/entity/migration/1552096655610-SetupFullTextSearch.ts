/* import { MigrationInterface, QueryRunner } from "typeorm";

export class SetupFullTextSearch1552096655610 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`
    update text_data set document_with_weights = 
    setweight(to_tsvector(ar), 'A') ||  setweight(to_tsvector(en), 'B') 

    CREATE INDEX document_weights_idx
    ON text_data
    USING GIN (document_with_weights);

    CREATE FUNCTION text_data_tsvector_trigger() RETURNS trigger AS $$
    begin
      new.document_with_weights :=
      setweight(to_tsvector('english', coalesce(new.ar, '')), 'A')
      || setweight(to_tsvector('english', coalesce(new.en, '')), 'B')
      return new;
    end
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER tsvectorupdate BEFORE INSERT OR UPDATE
    ON text_data FOR EACH ROW EXECUTE PROCEDURE text_data_tsvector_trigger();
        `);
    }

    public async down(): Promise<any> {}
}
 */
