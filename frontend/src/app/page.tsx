'use client';

import { useState, useRef, useCallback } from 'react';
import styles from './page.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'https://food-3d-backend.onrender.com/api';

type JobMode = 'photo' | 'video';
type JobStatus = 'queued' | 'running' | 'done' | 'failed';

interface JobProgress {
  job_id: string;
  status: JobStatus;
  progress: number;
  stage: string;
  message: string | null;
}

interface JobResult {
  job_id: string;
  model_glb_url: string | null;
  metadata_url: string | null;
}

const STAGES = ['ingest', 'preprocess', 'reconstruct', 'postprocess', 'export'];

export default function Home() {
  const [mode, setMode] = useState<JobMode>('photo');
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [job, setJob] = useState<JobProgress | null>(null);
  const [result, setResult] = useState<JobResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const accept = mode === 'photo' ? 'image/*' : 'video/*';

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    setFiles(Array.from(e.dataTransfer.files));
  }, []);

  const pollJob = (jobId: string) => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/jobs/${jobId}`);
        const data: JobProgress = await res.json();
        setJob(data);
        if (data.status === 'done') {
          clearInterval(pollRef.current!);
          const r = await fetch(`${API_BASE}/jobs/${jobId}/result`);
          setResult(await r.json());
        } else if (data.status === 'failed') {
          clearInterval(pollRef.current!);
          setError('Pipeline failed.');
        }
      } catch {
        clearInterval(pollRef.current!);
        setError('Lost connection to backend.');
      }
    }, 2000);
  };

  const handleSubmit = async () => {
    if (!files.length) return;
    setError(null);
    setJob(null);
    setResult(null);
    setUploading(true);
    const formData = new FormData();
    formData.append('mode', mode);
    files.forEach(f => formData.append('files', f));
    try {
      const res = await fetch(`${API_BASE}/jobs/`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error(await res.text());
      const data: JobProgress = await res.json();
      setJob(data);
      pollJob(data.job_id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setFiles([]);
    setJob(null);
    setResult(null);
    setError(null);
  };

  const stageIndex = (s: string) => STAGES.indexOf(s);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Food 3D</h1>
        <p>Upload food photos or video to generate a 3D model</p>
      </header>

      <main className={styles.main}>
        {!job && !result && (
          <section className={styles.card}>
            <div className={styles.modeToggle}>
              {(['photo', 'video'] as JobMode[]).map(m => (
                <button
                  key={m}
                  className={`${styles.modeBtn} ${mode === m ? styles.active : ''}`}
                  onClick={() => { setMode(m); setFiles([]); }}
                >
                  {m === 'photo' ? 'Photos' : 'Video'}
                </button>
              ))}
            </div>

            <div
              className={`${styles.dropZone} ${dragging ? styles.dragging : ''} ${files.length ? styles.hasFiles : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                multiple={mode === 'photo'}
                onChange={e => e.target.files && setFiles(Array.from(e.target.files))}
                style={{ display: 'none' }}
              />
              {files.length > 0 ? (
                <p className={styles.fileCount}>{files.length} file{files.length > 1 ? 's' : ''} selected</p>
              ) : (
                <>
                  <p className={styles.dropLabel}>Drop {mode === 'photo' ? 'images' : 'a video'} here</p>
                  <span className={styles.dropHint}>or click to browse</span>
                </>
              )}
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <button
              className={styles.submitBtn}
              onClick={handleSubmit}
              disabled={!files.length || uploading}
            >
              {uploading ? 'Uploading...' : 'Generate 3D Model'}
            </button>
          </section>
        )}

        {job && !result && (
          <section className={styles.card}>
            <p className={styles.jobLabel}>Job ID: <code>{job.job_id}</code></p>

            <div className={styles.stages}>
              {STAGES.map(s => (
                <div
                  key={s}
                  className={[
                    styles.stage,
                    job.stage === s && job.status === 'running' ? styles.stageActive : '',
                    stageIndex(s) < stageIndex(job.stage) || job.status === 'done' ? styles.stageDone : '',
                  ].join(' ')}
                >
                  {s}
                </div>
              ))}
            </div>

            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${job.progress}%` }} />
            </div>
            <p className={styles.progressText}>{job.progress}% &mdash; {job.status}</p>
            {job.message && <p className={styles.message}>{job.message}</p>}
            {error && <p className={styles.error}>{error}</p>}
          </section>
        )}

        {result && (
          <section className={styles.card}>
            <div className={styles.resultHeader}>
              <h2>3D Model Ready</h2>
              <p className={styles.jobLabel}>Job ID: <code>{result.job_id}</code></p>
            </div>
            <div className={styles.resultLinks}>
              {result.model_glb_url && (
                <a
                  href={`${API_BASE.replace('/api', '')}${result.model_glb_url}`}
                  className={styles.downloadBtn}
                  download
                >
                  Download .glb
                </a>
              )}
              {result.metadata_url && (
                <a
                  href={`${API_BASE.replace('/api', '')}${result.metadata_url}`}
                  className={styles.secondaryBtn}
                  target="_blank"
                  rel="noreferrer"
                >
                  View Metadata
                </a>
              )}
            </div>
            <button className={styles.resetBtn} onClick={reset}>Process Another</button>
          </section>
        )}
      </main>
    </div>
  );
}