import gensim.downloader as api
from gensim.models.word2vec import Word2Vec
import csv
corpus = api.load('text8')
model = Word2Vec(corpus)
answer_words = []
all_words = []

def no_intersect(string1, string2): 
    count = 0
    for char in set(string1):
        count+= min(string1.count(char), string2.count(char))
    return count == 0

with open('unigram_freq.csv', newline='') as csvfile:
    reader = csv.reader(csvfile, delimiter=',')
    for row in reader:
        if row[2] == '5' and row[3] == 'TRUE' and row[4] == '5':
            answer_words.append(row[0])
        if row[2] == '5' and row[4] == '5':
            all_words.append(row[0])
pairs = []
print(f"Word,Dual,Dual2")
for word in answer_words:
    candidates = list(filter(lambda x: no_intersect(word,x), all_words))
    candidates2 = list(filter(lambda x: no_intersect(word,x), answer_words))
    scores = []
    for c in candidates:
        if c in model.wv.key_to_index:
            try:
                scores.append({ 'word': c, 'score' : model.wv.similarity(word,c)})
            except Exception:
                pass
    scores2 = []
    for c in candidates2:
        if c in model.wv.key_to_index:
            try:
                scores2.append({ 'word': c, 'score' : model.wv.similarity(word,c)})
            except Exception:
                pass
    newlist = sorted(scores, key=lambda d: d['score'])
    newlist2 = sorted(scores2, key=lambda d: d['score'])
    if len(newlist) > 0 and len(newlist2) > 0:
        dual = newlist[-1]["word"]
        dual2 = newlist2[-1]["word"]
        pair = {'word':word, 'dual': dual, 'dual2' : dual2 }
        pairs.append(pair)
        print(f"{word},{dual},{dual2}")
