import type {Database} from './database';
export async function seedWorkspace(db:Database,userId:string){await db.transaction(async tx=>{
 await tx.query("UPDATE \"user\" SET role='admin' WHERE id=$1",[userId]);
 await tx.query("INSERT INTO networks(id,name) VALUES('demo','Rede de desenvolvimento') ON CONFLICT DO NOTHING");
 await tx.query("INSERT INTO franchisees(id,network_id,name) VALUES('demo-owner','demo','Franqueado de demonstração') ON CONFLICT DO NOTHING");
 await tx.query("INSERT INTO memberships(user_id,network_id,role) VALUES($1,'demo','admin') ON CONFLICT DO NOTHING",[userId]);
 for(const [id,name] of [['jardim','Loja Jardim'],['praca','Loja Praça']])await tx.query("INSERT INTO stores(id,network_id,franchisee_id,name) VALUES($1,'demo','demo-owner',$2) ON CONFLICT DO NOTHING",[id,name]);
 const items=[['Leite integral · 1 L','7890000000001','Mercearia',599,18,6],['Café torrado e moído · 500 g','7890000000002','Mercearia',1890,4,6],['Água mineral · 500 ml','7890000000003','Bebidas',250,32,12],['Chocolate ao leite · 80 g','7890000000004','Doces',749,0,5]];
 for(const [name,code,category,price,stock,minimum] of items){const product=(await tx.query<{id:number}>("INSERT INTO products(network_id,name,code,category) VALUES('demo',$1,$2,$3) ON CONFLICT(network_id,code) DO UPDATE SET category=excluded.category RETURNING id",[name,code,category])).rows[0];for(const [index,store] of ['jardim','praca'].entries())await tx.query("INSERT INTO listings(network_id,store_id,product_id,price,stock,minimum) VALUES('demo',$1,$2,$3,$4,$5) ON CONFLICT DO NOTHING",[store,product.id,price,Number(stock)+index*7,minimum]);}
});}
