import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { Client } from 'pg';
import { DataSource } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        join(__dirname, '..', '.env'),
        join(__dirname, '..', '..', '..', '.env'),
      ],
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres' as const,
        host: process.env.DATABASE_HOST ?? 'localhost',
        port: Number(process.env.DATABASE_PORT ?? 5433),
        username: process.env.DATABASE_USER ?? 'postgres',
        password: process.env.DATABASE_PASSWORD ?? 'postgres',
        database: process.env.DATABASE_NAME ?? 'auth_db',
        schema: process.env.DATABASE_SCHEMA ?? 'orders',
        autoLoadEntities: true,
        synchronize: (process.env.TYPEORM_SYNCHRONIZE ?? 'true') === 'true',
      }),
      dataSourceFactory: async (options) => {
        if (!options) {
          throw new Error('TypeORM options are required');
        }

        const postgresOptions = options as PostgresConnectionOptions;
        const schemaName = postgresOptions.schema ?? 'orders';
        const client = new Client({
          host: postgresOptions.host,
          port: postgresOptions.port,
          user: postgresOptions.username,
          password: postgresOptions.password,
          database: postgresOptions.database,
        });

        await client.connect();
        await client.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
        await client.end();

        const dataSource = new DataSource(postgresOptions);
        return dataSource.initialize();
      },
    }),
    OrdersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
