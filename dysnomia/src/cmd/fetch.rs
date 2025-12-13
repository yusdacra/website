use crate::globals::{get_pwd, print_to_console, register_task, remove_task, to_shell_err};
use anyhow::{Result, anyhow};
use futures::future::{AbortHandle, Abortable};
use jacquard::types::aturi::AtUri;
use jacquard::types::ident::AtIdentifier;
use jacquard::types::string::Rkey;
use jacquard::{
    api::com_atproto::{
        repo::{get_record::GetRecord, list_records::ListRecords},
        sync::get_repo::GetRepo,
    },
    client::{Agent, MemorySessionStore, credential_session::CredentialSession},
    identity::{resolver::IdentityResolver, slingshot_resolver_default},
    prelude::*,
    types::{did::Did, nsid::Nsid},
};
use jacquard_repo::{
    Repository,
    car::parse_car_bytes,
    storage::{BlockStore, MemoryBlockStore},
};
use nu_engine::CallExt;
use nu_protocol::IntoPipelineData;
use nu_protocol::{
    Category, PipelineData, ShellError, Signature, SyntaxShape, Value,
    engine::{Command, EngineState, Stack},
};
use std::io::Write;
use std::str::FromStr;
use std::sync::Arc;
use url::Url;
use wasm_bindgen_futures::spawn_local;

#[derive(Clone)]
pub struct Fetch;

impl Command for Fetch {
    fn name(&self) -> &str {
        "fetch"
    }

    fn signature(&self) -> Signature {
        Signature::build(self.name())
            .required(
                "uri",
                SyntaxShape::String,
                "HTTP URI or AT URI (at://identifier[/collection[/rkey]])",
            )
            .named("output", SyntaxShape::Filepath, "output path", Some('o'))
            .category(Category::Network)
    }

    fn description(&self) -> &str {
        "fetch files using HTTP or fetch records from an AT Protocol repository.\nsupports full repo (CAR), collection, or a single record."
    }

    fn run(
        &self,
        engine_state: &EngineState,
        stack: &mut Stack,
        call: &nu_protocol::engine::Call,
        _input: PipelineData,
    ) -> Result<PipelineData, ShellError> {
        let uri_arg: String = call.req(engine_state, stack, 0)?;
        let output_arg: Option<String> = call.get_flag(engine_state, stack, "output")?;
        let output_span = call.get_flag_span(stack, "output");

        let at_uri = uri_arg
            .starts_with("at://")
            .then(|| {
                AtUri::from_str(&uri_arg).map_err(|err| ShellError::GenericError {
                    error: "invalid AT URI format".into(),
                    msg: err.to_string(),
                    span: Some(call.arguments_span()),
                    help: None,
                    inner: vec![],
                })
            })
            .transpose()?;
        let uri = at_uri
            .is_none()
            .then(|| {
                Url::from_str(&uri_arg).map_err(|err| ShellError::GenericError {
                    error: "invalid URI format".into(),
                    msg: err.to_string(),
                    span: Some(call.arguments_span()),
                    help: None,
                    inner: vec![],
                })
            })
            .transpose()?;

        // Determine target directory
        let pwd = get_pwd();
        let base_dir = if let Some(out) = output_arg.as_ref() {
            pwd.join(out.trim_end_matches('/'))
                .map_err(to_shell_err(output_span.unwrap()))?
        } else {
            pwd.join("").unwrap()
        };

        let final_path = if let Some(at_uri) = at_uri.as_ref() {
            match (at_uri.collection(), at_uri.rkey()) {
                (None, _) => base_dir
                    .join(at_uri.authority())
                    .map_err(to_shell_err(call.span()))?,
                (Some(collection), None) => base_dir
                    .join(collection)
                    .map_err(to_shell_err(call.span()))?,
                // use rkey as file name
                (Some(_), Some(rkey)) => output_arg
                    .is_some()
                    .then(|| Ok(base_dir.clone()))
                    .unwrap_or_else(|| base_dir.join(&rkey.0).map_err(to_shell_err(call.span())))?,
            }
        } else if let Some(uri) = uri.as_ref() {
            // choose file name from uri
            output_arg
                .is_some()
                .then(|| Ok(base_dir.clone()))
                .unwrap_or_else(|| {
                    base_dir
                        .join(
                            uri.path()
                                .split('/')
                                .rfind(|a| !a.is_empty())
                                .unwrap_or("index"),
                        )
                        .map_err(to_shell_err(call.span()))
                })?
        } else {
            // todo: make these into an enum so we dont need this
            unreachable!("either of at_uri or uri should be set")
        };

        if !final_path.exists().map_err(to_shell_err(call.span()))? {
            // if http uri or at uri with rkey, we create parent dir since we'll
            // write just a single file, otherwise we create this path as directory
            if at_uri.as_ref().map_or(true, |at| at.rkey().is_some()) {
                final_path
                    .parent()
                    .create_dir_all()
                    .map_err(to_shell_err(call.span()))?;
            } else {
                final_path
                    .create_dir_all()
                    .map_err(to_shell_err(call.span()))?;
            }
        }

        let (abort_handle, abort_registration) = AbortHandle::new_pair();
        let task_desc = format!("{name} {uri_arg}", name = self.name());
        let task_id = register_task(task_desc.clone(), abort_handle);

        spawn_local(async move {
            let task_future = async {
                if let Some(at_uri) = at_uri {
                    let identifier = at_uri.authority().clone();
                    match (at_uri.collection(), at_uri.rkey()) {
                        (Some(coll), Some(key)) => {
                            fetch_record(identifier, coll.clone(), key.0.clone(), final_path).await
                        }
                        (Some(coll), None) => {
                            fetch_collection(identifier, coll.clone(), final_path).await
                        }
                        _ => fetch_repo(identifier, final_path).await,
                    }
                } else if let Some(uri) = uri {
                    fetch_file(uri, final_path).await
                } else {
                    Ok(())
                }
            };

            let abortable = Abortable::new(task_future, abort_registration);

            match abortable.await {
                Ok(result) => {
                    remove_task(task_id);
                    match result {
                        Ok(_) => {}
                        Err(e) => {
                            print_to_console(
                                &format!("\x1b[31m✖\x1b[0m ({task_desc}) error: {e}"),
                                false,
                            );
                        }
                    }
                }
                Err(_) => {
                    remove_task(task_id);
                }
            }
        });

        Ok(Value::nothing(call.head).into_pipeline_data())
    }
}

async fn fetch_file(uri: Url, target_path: vfs::VfsPath) -> Result<()> {
    let response = reqwest::get(uri).await?;
    let content = response.bytes().await?;
    target_path.create_file()?.write_all(&content)?;
    Ok(())
}

async fn resolve_did(identifier: AtIdentifier<'_>) -> Result<Did<'_>> {
    match identifier {
        AtIdentifier::Did(did) => Ok(did),
        AtIdentifier::Handle(handle) => {
            let did = slingshot_resolver_default().resolve_handle(&handle).await?;
            Ok(did)
        }
    }
}

async fn resolve_pds(did: &Did<'_>) -> Result<Url> {
    slingshot_resolver_default()
        .resolve_did_doc(did)
        .await?
        .parse()?
        .pds_endpoint()
        .ok_or_else(|| anyhow!("no pds endpoint in did doc"))
}

async fn create_agent(pds: Url) -> BasicClient {
    let store = MemorySessionStore::default();
    let session = CredentialSession::new(Arc::new(store), Arc::new(slingshot_resolver_default()));
    session.set_endpoint(pds).await;
    Agent::new(session)
}

async fn fetch_record(
    identifier: AtIdentifier<'_>,
    collection: Nsid<'_>,
    rkey: Rkey<'_>,
    target_path: vfs::VfsPath,
) -> anyhow::Result<()> {
    let did = resolve_did(identifier).await?;
    let pds = resolve_pds(&did).await?;
    let client = create_agent(pds).await;

    let nsid = Nsid::new(&collection)?;

    let request = GetRecord::new()
        .repo(did)
        .collection(nsid)
        .rkey(rkey.clone());

    let output = client.send(request.build()).await?.into_output()?;
    let file = target_path.create_file()?;
    serde_json::to_writer_pretty(file, &output.value)?;

    Ok(())
}

async fn fetch_collection(
    identifier: AtIdentifier<'_>,
    collection: Nsid<'_>,
    target_path: vfs::VfsPath,
) -> anyhow::Result<()> {
    let did = resolve_did(identifier).await?;
    let pds = resolve_pds(&did).await?;
    let client = create_agent(pds).await;

    let mut cursor: Option<String> = None;

    loop {
        let request = ListRecords::new()
            .repo(did.clone())
            .collection(collection.clone())
            .limit(100)
            .cursor(cursor.map(Into::into));

        let response = client.send(request.build()).await?;

        let output = response.into_output()?;

        for rec in output.records {
            if let Some(rkey) = rec.uri.rkey() {
                let file = target_path.join(&rkey.0)?.create_file()?;
                serde_json::to_writer_pretty(file, &rec.value)?;
            }
        }

        if let Some(c) = output.cursor {
            cursor = Some(c.into());
        } else {
            break;
        }
    }

    Ok(())
}

async fn fetch_repo(identifier: AtIdentifier<'_>, target_path: vfs::VfsPath) -> Result<()> {
    let did = resolve_did(identifier).await?;
    let pds = resolve_pds(&did).await?;
    let client = create_agent(pds).await;

    let response = client.send(GetRepo::new().did(did).build()).await?;

    // parse the car and create the repo
    let car_bytes = response.into_output()?.body;
    let parsed = parse_car_bytes(&car_bytes).await?;
    let storage = Arc::new(MemoryBlockStore::new_from_blocks(parsed.blocks));
    let repo = Repository::from_commit(storage, &parsed.root).await?;

    // Iterate over all leaves in the MST
    // repo.mst() gives us the Mst<S>
    // mst.leaves() returns Vec<(SmolStr, IpldCid)>
    let leaves = repo.mst().leaves_sequential().await?;

    for (key, cid) in leaves {
        // key format: collection/rkey
        let key_str = key.as_str();

        if let Some((collection, rkey)) = key_str.split_once('/') {
            // Get the record block from storage
            // The record data is just a CBOR block. We need to convert it to JSON for readability.
            if let Some(block_bytes) = repo.storage().get(&cid).await? {
                // Deserialize DAG-CBOR to generic JSON Value
                let json_val: jacquard::RawData = serde_ipld_dagcbor::from_slice(&block_bytes)
                    .map_err(|e| anyhow!("failed to deserialize record {}: {}", key, e))?;

                let coll_dir = target_path.join(collection)?;
                if !coll_dir.exists()? {
                    coll_dir.create_dir_all()?;
                }
                let file = coll_dir.join(rkey)?.create_file()?;

                serde_json::to_writer_pretty(file, &json_val)?;
            }
        }
    }

    Ok(())
}
