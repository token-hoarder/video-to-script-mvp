import { describe, expect, it } from 'vitest';
import { movieDuration, ownVideoPath, storyPrompt, validateBlocks, prepareDraft } from '../lib/reel';
import { readFileSync } from 'node:fs';
const uid = '12345678-1234-1234-1234-123456789012';
describe('reel safeguards', () => {
  it('allows only the authenticated upload folder and expected origin', () => {
    expect(ownVideoPath(`${uid}/test.mp4`, uid, 'https://example.supabase.co')).toBe(`${uid}/test.mp4`);
    for (const path of ['https://attacker.test/file.mp4', `${uid}/../other.mp4`, 'other/test.mp4', `${uid}/%2e%2e/test.mp4`]) expect(() => ownVideoPath(path, uid, 'https://example.supabase.co')).toThrow();
  });
  it('reads actual fixture duration and rejects malformed media', () => {
    expect(movieDuration(readFileSync('e2e/fixtures/dummy.mp4'))).toBeCloseTo(10.0267, 2);
    expect(() => movieDuration(new Uint8Array(20))).toThrow();
  });
  it('rejects overlaps, excessive text and unreadable timings', () => {
    expect(validateBlocks([{startTime:0,endTime:2,text:'Hello there'}],10)).toHaveLength(1);
    for (const blocks of [[{startTime:0,endTime:11,text:'Hi'}],[{startTime:0,endTime:0.5,text:'Hello'}],[{startTime:0,endTime:3,text:'Hello'},{startTime:2,endTime:4,text:'There'}],[{startTime:0,endTime:5,text:'x'.repeat(101)}]]) expect(() => validateBlocks(blocks,10)).toThrow();
  });
  it('uses screen reading constraints rather than voiceover pacing', () => {
    expect(storyPrompt('A handmade gift','Hinglish','Warm',10)).toContain('sound OFF');
    expect(storyPrompt('A handmade gift','Hinglish','Warm',10)).not.toContain('130 words');
  });
  it('fits cramped AI timings while preserving words, order and reading time', () => {
    const draft=[{startTime:2,endTime:2.2,text:'Your memories deserve a little more time'},{startTime:2.1,endTime:12,text:'Make your free book'}];
    const fitted=prepareDraft(draft,7);
    expect(fitted.map(x=>x.text)).toEqual(draft.map(x=>x.text));
    expect(fitted[0].startTime).toBeLessThanOrEqual(0.5);
    expect(fitted[1].startTime).toBeGreaterThanOrEqual(fitted[0].endTime);
    expect(fitted[1].endTime).toBeLessThanOrEqual(7);
    expect(()=>validateBlocks(fitted,7)).not.toThrow();
    expect(()=>prepareDraft(draft,2)).toThrow();
    expect(()=>prepareDraft([{startTime:0,endTime:2,text:'x'.repeat(101)}],10)).toThrow();
  });
});
