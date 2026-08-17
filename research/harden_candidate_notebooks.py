"""Apply the locked audit corrections to the two candidate Kaggle notebooks.

The rewrite is intentionally cell-indexed so the original narrative remains
recognisable. All stale outputs are cleared because they came from invalid splits.
"""
from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def source(text: str) -> list[str]:
    return text.strip("\n").splitlines(keepends=True)


def load(name: str) -> tuple[Path, dict]:
    path = ROOT / "notebook" / name
    return path, json.loads(path.read_text(encoding="utf-8"))


def clear_outputs(notebook: dict) -> None:
    for cell in notebook["cells"]:
        if cell["cell_type"] == "code":
            cell["execution_count"] = None
            cell["outputs"] = []


def save(path: Path, notebook: dict) -> None:
    path.write_text(json.dumps(notebook, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")


eye_path, eye = load("dataset eyetrack.ipynb")
eye["cells"][0]["source"] = source("""
# Autism Eye Tracking — participant-safe exploratory image classification

Dataset Carette berisi **rekaman berulang dari 54 partisipan**, bukan 547 anak independen. Notebook ini hanya eksperimen pembanding CNN; model web tetap baseline geometri yang interpretabel. Semua split wajib berdasarkan ID partisipan pada nama file (`T{C,S}###_PP.png`).
""")
eye["cells"][1]["source"] = source("""
## 1. Kontrak eksperimen yang dikunci

- Unit split, pembobotan, threshold, dan evaluasi adalah **partisipan**, bukan gambar.
- dHash hanya mengaudit salinan/konflik; dHash tidak pernah menggantikan ID partisipan.
- Test dikunci sampai akhir. Threshold dan pilihan TTA hanya berasal dari validation.
- Setiap anak memiliki total bobot training yang sama; anak dengan lebih banyak rekaman tidak mendominasi loss.
- Satu grouped holdout masih tidak cukup untuk klaim stabil. Hasil harus disebut eksploratori sampai repeated nested participant-CV dan kohort eksternal tersedia.
""")
eye["cells"][2]["source"] = source("""
# Kaggle environment / reproducibility
import os, random, re, warnings
from pathlib import Path
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from PIL import Image

import tensorflow as tf
from sklearn.model_selection import StratifiedGroupKFold
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score, f1_score, accuracy_score

SEED = 42
IMG_SIZE = 224
BATCH_SIZE = 32
EPOCHS_HEAD = 20
EPOCHS_FINE_TUNE = 12
AUTOTUNE = tf.data.AUTOTUNE

os.environ['PYTHONHASHSEED'] = str(SEED)
random.seed(SEED); np.random.seed(SEED); tf.keras.utils.set_random_seed(SEED)
try:
    tf.config.experimental.enable_op_determinism()
except Exception:
    pass
warnings.filterwarnings('ignore')
print('TensorFlow:', tf.__version__)
print('GPU:', tf.config.list_physical_devices('GPU'))
""")
eye["cells"][4]["source"] = source("""
INPUT_ROOT = Path('/kaggle/input')
if not INPUT_ROOT.exists():
    raise FileNotFoundError('Tambahkan dataset autism-eye-tracking melalui Kaggle Add Input.')

image_exts = {'.jpg', '.jpeg', '.png', '.bmp', '.webp'}
all_images = [p for p in INPUT_ROOT.rglob('*') if p.is_file() and p.suffix.lower() in image_exts]

def metadata_from_path(path: Path):
    parts = {part.casefold() for part in path.parts}
    if 'tcimages' in parts:
        label, class_name = 0, 'Non-ASD'
    elif 'tsimages' in parts:
        label, class_name = 1, 'ASD'
    else:
        return None
    match = re.match(r'^T[CS]\\d+_(\\d+)$', path.stem, flags=re.IGNORECASE)
    if not match:
        raise ValueError(f'Filename tidak mengikuti T{{C,S}}###_PP: {path.name}')
    return {'path': str(path), 'label': label, 'class_name': class_name, 'participant_id': f'{class_name}:{match.group(1)}'}

rows = [row for path in all_images if (row := metadata_from_path(path)) is not None]
df = pd.DataFrame(rows)
if df.empty:
    raise RuntimeError('Folder TCImages/TSImages tidak ditemukan.')
if df.groupby('participant_id').label.nunique().max() != 1:
    raise RuntimeError('Satu participant_id memiliki label diagnosis yang bertentangan.')

print('Total records:', len(df), '| participants:', df.participant_id.nunique())
display(df.groupby('class_name').agg(records=('path', 'size'), participants=('participant_id', 'nunique')))
""")
eye["cells"][5]["source"] = source("""
## 3. Audit visual dan grouping anti-leakage

dHash dipakai hanya untuk mendeteksi salinan visual dan konflik. **Group split tetap `participant_id`** yang diekstrak dari suffix filename sesuai protokol Carette. Ini mencegah rekaman anak yang sama menyeberang split.
""")
eye["cells"][6]["source"] = source("""
def dhash(path, size=8):
    with Image.open(path) as im:
        gray = im.convert('L').resize((size + 1, size), Image.Resampling.LANCZOS)
        pixels = np.asarray(gray, dtype=np.int16)
    return np.packbits((pixels[:, 1:] > pixels[:, :-1]).astype(np.uint8)).tobytes().hex()

hashes, readable = [], []
for path in df.path:
    try:
        hashes.append(dhash(path)); readable.append(True)
    except Exception as exc:
        print('Unreadable:', path, '|', exc); hashes.append(None); readable.append(False)
df['dhash'] = hashes
df = df.loc[readable].copy().reset_index(drop=True)

conflicts = df.groupby('dhash').label.nunique()
conflict_hashes = conflicts[conflicts > 1].index
if len(conflict_hashes):
    conflict_rows = df[df.dhash.isin(conflict_hashes)].copy()
    conflict_rows.to_csv('/kaggle/working/ambiguous_hash_groups.csv', index=False)
    df = df.loc[~df.dhash.isin(conflict_hashes)].copy().reset_index(drop=True)
    print(f'Menghapus {len(conflict_rows)} record dari {len(conflict_hashes)} dHash konflik.')

df['group'] = df['participant_id']
print(f'Usable records: {len(df)} | participants: {df.group.nunique()} | unique dHash: {df.dhash.nunique()}')
""")
eye["cells"][8]["source"] = source("""
## 4. Participant-isolated train/validation/test

Outer fold membentuk holdout test per anak; inner fold membentuk validation per anak. Assertion memeriksa **ID partisipan**, bukan hash gambar. Angka dari run notebook lama tidak boleh dibandingkan karena output lama sudah dihapus.
""")
eye["cells"][9]["source"] = source("""
if df.groupby('label').group.nunique().min() < 5:
    raise ValueError('Setiap kelas perlu minimal 5 partisipan untuk StratifiedGroupKFold(5).')

outer = StratifiedGroupKFold(n_splits=5, shuffle=True, random_state=SEED)
trainval_idx, test_idx = next(outer.split(df, y=df.label, groups=df.group))
trainval = df.iloc[trainval_idx].reset_index(drop=True)
test_df = df.iloc[test_idx].reset_index(drop=True)
inner = StratifiedGroupKFold(n_splits=5, shuffle=True, random_state=SEED + 1)
train_idx, val_idx = next(inner.split(trainval, y=trainval.label, groups=trainval.group))
train_df = trainval.iloc[train_idx].reset_index(drop=True)
val_df = trainval.iloc[val_idx].reset_index(drop=True)

splits = {'train': train_df, 'validation': val_df, 'test': test_df}
for name, frame in splits.items():
    participants = frame.drop_duplicates('participant_id')
    print(f"{name:10} records={len(frame):3} | children={len(participants):2} | ASD-child rate={participants.label.mean():.3f}")
for left, right in [('train', 'validation'), ('train', 'test'), ('validation', 'test')]:
    overlap = set(splits[left].participant_id) & set(splits[right].participant_id)
    assert not overlap, f'PARTICIPANT LEAKAGE: {left}/{right} berbagi {len(overlap)} anak'
print('PASS: tidak ada partisipan yang menyeberang split.')
train_df.to_csv('/kaggle/working/train_manifest.csv', index=False)
val_df.to_csv('/kaggle/working/validation_manifest.csv', index=False)
test_df.to_csv('/kaggle/working/test_manifest.csv', index=False)
""")
eye["cells"][11]["source"] = source("""
augment = tf.keras.Sequential([
    tf.keras.layers.RandomRotation(0.05, fill_mode='reflect'),
    tf.keras.layers.RandomTranslation(0.05, 0.05, fill_mode='reflect'),
    tf.keras.layers.RandomZoom(0.10, 0.10, fill_mode='reflect'),
    tf.keras.layers.RandomContrast(0.10),
], name='train_augmentation')

participant_table = train_df.drop_duplicates('participant_id')
class_counts = participant_table.label.value_counts()
class_weights = {label: len(participant_table) / (2 * count) for label, count in class_counts.items()}
record_counts = train_df.groupby('participant_id').size()
train_df = train_df.copy()
train_df['sample_weight'] = train_df.apply(lambda row: class_weights[row.label] / record_counts[row.participant_id], axis=1)
train_df['sample_weight'] /= train_df.sample_weight.mean()

def decode_image(path, label):
    image = tf.io.read_file(path)
    image = tf.io.decode_image(image, channels=3, expand_animations=False)
    image.set_shape([None, None, 3])
    image = tf.image.resize(image, (IMG_SIZE, IMG_SIZE), antialias=True)
    return tf.cast(image, tf.float32), tf.cast(label, tf.float32)

def decode_weighted(path, label, weight):
    image, label = decode_image(path, label)
    return image, label, tf.cast(weight, tf.float32)

def make_ds(frame, training=False, tta=False):
    if training:
        ds = tf.data.Dataset.from_tensor_slices((frame.path.values, frame.label.values, frame.sample_weight.values))
        ds = ds.shuffle(len(frame), seed=SEED, reshuffle_each_iteration=True)
        ds = ds.map(decode_weighted, num_parallel_calls=AUTOTUNE)
        ds = ds.map(lambda x, y, w: (augment(x, training=True), y, w), num_parallel_calls=AUTOTUNE)
    else:
        ds = tf.data.Dataset.from_tensor_slices((frame.path.values, frame.label.values))
        ds = ds.map(decode_image, num_parallel_calls=AUTOTUNE)
        if tta:
            ds = ds.map(lambda x, y: (augment(x, training=True), y), num_parallel_calls=AUTOTUNE)
    return ds.batch(BATCH_SIZE).prefetch(AUTOTUNE)

train_ds = make_ds(train_df, training=True)
val_ds = make_ds(val_df)
test_ds = make_ds(test_df)
print('Total sample weight per child (range):', train_df.groupby('participant_id').sample_weight.sum().agg(['min', 'max']).to_dict())
""")
for index in (14, 16):
    text = ''.join(eye["cells"][index]["source"])
    text = text.replace(', class_weight=fit_class_weight', '')
    eye["cells"][index]["source"] = source(text)
eye["cells"][17]["source"] = source("""
## 8. Pilih inference mode dan threshold pada validation **level anak**

Probabilitas record dirata-ratakan lebih dulu per partisipan. Threshold dipilih setelah agregasi ini karena unit keputusan produk adalah anak. Test tetap tidak disentuh sampai sel berikutnya.
""")
eye["cells"][18]["source"] = source("""
def predict_tta(frame, n_augmented_passes=6):
    probabilities = [model.predict(make_ds(frame), verbose=0).ravel()]
    for _ in range(n_augmented_passes):
        probabilities.append(model.predict(make_ds(frame, tta=True), verbose=0).ravel())
    return np.mean(probabilities, axis=0)

def aggregate_children(frame, probabilities):
    scored = frame[['participant_id', 'label']].copy()
    scored['asd_probability'] = probabilities
    return scored.groupby('participant_id', as_index=False).agg(label=('label', 'first'), asd_probability=('asd_probability', 'mean'))

val_plain = aggregate_children(val_df, model.predict(val_ds, verbose=0).ravel())
val_tta = aggregate_children(val_df, predict_tta(val_df))
thresholds = np.arange(0.05, 0.96, 0.01)
candidate_rows = []
for inference_mode, child_scores in {'plain': val_plain, 'tta_6': val_tta}.items():
    for threshold in thresholds:
        prediction = child_scores.asd_probability >= threshold
        candidate_rows.append({
            'inference_mode': inference_mode,
            'threshold': threshold,
            'balanced_proxy': (accuracy_score(child_scores.label[child_scores.label == 0], prediction[child_scores.label == 0]) + accuracy_score(child_scores.label[child_scores.label == 1], prediction[child_scores.label == 1])) / 2,
            'macro_f1': f1_score(child_scores.label, prediction, average='macro'),
        })
threshold_table = pd.DataFrame(candidate_rows)
best_row = threshold_table.sort_values(['balanced_proxy', 'macro_f1'], ascending=False).iloc[0]
best_threshold = float(best_row.threshold)
INFERENCE_MODE = str(best_row.inference_mode)
print(f'Selected on {len(val_plain)} validation children: {INFERENCE_MODE}, threshold={best_threshold:.2f}')
display(threshold_table.sort_values(['balanced_proxy', 'macro_f1'], ascending=False).head(12))
""")
eye["cells"][19]["source"] = source("""
# FINAL LOCKED PARTICIPANT-LEVEL HOLDOUT EVALUATION
test_record_prob = predict_tta(test_df) if INFERENCE_MODE == 'tta_6' else model.predict(test_ds, verbose=0).ravel()
results = aggregate_children(test_df, test_record_prob)
results['prediction'] = (results.asd_probability >= best_threshold).astype(int)
auc_point = roc_auc_score(results.label, results.asd_probability)

rng = np.random.default_rng(SEED)
bootstrap_auc = []
for _ in range(2000):
    sampled = results.iloc[rng.integers(0, len(results), len(results))]
    if sampled.label.nunique() == 2:
        bootstrap_auc.append(roc_auc_score(sampled.label, sampled.asd_probability))
ci_low, ci_high = np.quantile(bootstrap_auc, [0.025, 0.975])
print(f'Test children: {len(results)}')
print(f'Participant AUC: {auc_point:.4f} (bootstrap 95% CI {ci_low:.4f}–{ci_high:.4f})')
print(f'Participant accuracy: {accuracy_score(results.label, results.prediction):.4f}')
print(classification_report(results.label, results.prediction, target_names=['Non-ASD', 'ASD'], digits=4))
cm = confusion_matrix(results.label, results.prediction)
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=['Non-ASD', 'ASD'], yticklabels=['Non-ASD', 'ASD'])
plt.xlabel('Predicted'); plt.ylabel('True'); plt.title('Locked participant-level test matrix'); plt.show()
results.to_csv('/kaggle/working/test_participant_predictions.csv', index=False)
""")
eye["cells"][20]["source"] = source("""
## 9. Interpretasi yang diizinkan

Periksa kesalahan pada level partisipan dan rentang CI. CNN ini tidak diekspor ke webapp: citra Carette adalah raster scanpath 250 Hz usia sekolah, sedangkan runtime web menerima koordinat iris kamera 20–30 Hz. Model produksi hanya boleh dipilih setelah validasi berpasangan lintas perangkat dan usia.
""")
clear_outputs(eye)
save(eye_path, eye)


face_path, face = load("dataset-wajah.ipynb")
face["cells"][0]["source"] = source("""
# QUARANTINED — face-photo ASD classifier

Notebook ini **bukan sumber model face/iris detection** dan tidak boleh diekspor ke Neurogaze. Dataset tidak memiliki participant ID, provenance, lisensi, consent, demografi, atau definisi label yang memadai; baseline properti teknis file juga sudah menunjukkan shortcut. Kode disimpan hanya untuk audit metodologis.
""")
face["cells"][4]["source"] = source("""
BASE_DIR = Path('/kaggle/input/datasets/sha0401/autismdataset/AutismDataset/consolidated')
WORK_DIR = Path('/kaggle/working/split')
# label 1 harus ASD agar ROC/AUC tidak terbalik.
CLASSES = ['Non_Autistic', 'Autistic']

DATA_GOVERNANCE = {
    'participant_id': None,
    'provenance': None,
    'license': None,
    'consent': None,
    'demographics': None,
    'label_definition': None,
}
ALLOW_UNGOVERNED_FACE_EXPERIMENT = False
missing = [key for key, value in DATA_GOVERNANCE.items() if not value]
if missing and not ALLOW_UNGOVERNED_FACE_EXPERIMENT:
    raise RuntimeError('QUARANTINE_FACE_DATASET: metadata wajib belum ada: ' + ', '.join(missing))

assert BASE_DIR.exists(), f'Path tidak ada: {BASE_DIR}'
IMG_SIZE = (300, 300)
BATCH_SIZE = 32
AUTOTUNE = tf.data.AUTOTUNE
EPOCHS_P1, LR_P1, WARMUP_P1 = 25, 3e-4, 3
EPOCHS_P2, LR_P2, WARMUP_P2, UNFREEZE_N = 30, 5e-5, 2, 50
VAL_RATIO, TEST_RATIO = 0.15, 0.15
""")
face["cells"][9]["source"] = source("""
---
## 4. Split record-level — tidak dapat disebut participant-safe

Tanpa participant ID, tidak ada cara membuktikan bahwa foto orang yang sama tidak menyeberang split. Cell berikut hanya boleh dijalankan bila governance gate sengaja dioverride untuk audit teknis; hasilnya tidak boleh menjadi klaim atau model web.
""")
face["cells"][32]["source"] = source("""
# Threshold dikunci dari VALIDATION, bukan test.
val_prob = best.predict(val_ds, verbose=1).ravel()
val_true = np.array(val_lbls)
fpr_val, tpr_val, thresholds_val = roc_curve(val_true, val_prob)
opt_idx = np.argmax(tpr_val - fpr_val)
opt_thresh = float(thresholds_val[opt_idx])

roc_auc_tta = roc_auc_score(y_true, y_prob_tta)
y_pred_tta = (y_prob_tta >= opt_thresh).astype(int)
print(f'Locked validation threshold: {opt_thresh:.4f}')
print(f'Test ROC-AUC (positive=Autistic): {roc_auc_tta:.4f}')
print('Test tidak dipakai untuk memilih threshold.')
""")
face["cells"][43]["source"] = source("""
---
## 14. Kesimpulan audit

- Pipeline lama **tidak menjamin no leakage** karena tidak ada participant ID.
- Angka lama tidak sah untuk pemilihan model: threshold dipilih pada test dan label positif ROC adalah `Non_Autistic`.
- Notebook sekarang fail-closed sampai provenance, lisensi, consent, demografi, definisi label, dan participant ID tersedia.
- Dataset wajah tidak digunakan untuk iris tracking maupun skor ASD Neurogaze. Runtime iris memakai model landmark MediaPipe lokal; klasifikasi replay memakai fitur scanpath Carette yang group-aware dan interpretabel.
""")
clear_outputs(face)
save(face_path, face)

print(f'Hardened: {eye_path}')
print(f'Quarantined: {face_path}')
